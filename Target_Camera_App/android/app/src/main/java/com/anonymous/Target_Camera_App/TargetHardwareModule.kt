package com.anonymous.Target_Camera_App

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Base64
import android.view.PixelCopy
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream
import java.util.ArrayDeque
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.hypot
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

class TargetHardwareModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), SensorEventListener, LifecycleEventListener {

  companion object {
    const val MODULE_NAME = "TargetHardware"
    const val EVENT_ORIENTATION = "targetHardwareOrientation"
    const val EVENT_AUDIO = "targetHardwareAudio"
    private const val PATCH_SIZE = 160
  }

  private val mainHandler = Handler(Looper.getMainLooper())
  private var bgThread: HandlerThread? = null
  private var bgHandler: Handler? = null

  // Accelerometer / Orientation state
  private val sensorManager: SensorManager? by lazy {
    reactContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
  }
  private var isSensorActive = false
  private var filteredGx = 0f
  private var filteredGy = 0f
  private var filteredGz = 9.81f
  private var hasSensorInit = false
  private var lastOrientationEmitMs = 0L

  // AudioRecord SPL monitor state
  private val isAudioRunning = AtomicBoolean(false)
  private var shouldResumeAudio = false
  private var audioThread: Thread? = null

  // Baseline CV grid (PATCH_SIZE x PATCH_SIZE grayscale luma 0..255)
  private val cvLock = Any()
  private var baselineLuma: FloatArray? = null
  private var confirmedHitMask: BooleanArray? = null
  private var baselineTimestampMs: Long = 0L

  init {
    reactContext.addLifecycleEventListener(this)
    ensureBgHandler()
  }

  override fun getName(): String = MODULE_NAME

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for RN NativeEventEmitter
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for RN NativeEventEmitter
  }

  private fun ensureBgHandler(): Handler {
    val existing = bgHandler
    if (existing != null && bgThread?.isAlive == true) return existing
    val thread = HandlerThread("TargetCvWorker").apply { start() }
    bgThread = thread
    val handler = Handler(thread.looper)
    bgHandler = handler
    return handler
  }

  private fun emitEvent(eventName: String, params: WritableMap) {
    if (!reactContext.hasActiveReactInstance()) return
    try {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
    } catch (_: Exception) {
      // Ignore if Catalyst instance torn down
    }
  }

  // ── Orientation / Spirit-Level Sensor ────────────────────────────────────────

  @ReactMethod
  fun startOrientationMonitoring(promise: Promise) {
    val sm = sensorManager
    val accel = sm?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    if (sm == null || accel == null) {
      promise.resolve(false)
      return
    }
    if (!isSensorActive) {
      hasSensorInit = false
      isSensorActive = sm.registerListener(this, accel, SensorManager.SENSOR_DELAY_UI)
    }
    promise.resolve(isSensorActive)
  }

  @ReactMethod
  fun stopOrientationMonitoring() {
    if (isSensorActive) {
      sensorManager?.unregisterListener(this)
      isSensorActive = false
    }
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type != Sensor.TYPE_ACCELEROMETER) return
    val ax = event.values[0]
    val ay = event.values[1]
    val az = event.values[2]

    if (!hasSensorInit) {
      filteredGx = ax
      filteredGy = ay
      filteredGz = az
      hasSensorInit = true
    } else {
      val alpha = 0.22f
      filteredGx += alpha * (ax - filteredGx)
      filteredGy += alpha * (ay - filteredGy)
      filteredGz += alpha * (az - filteredGz)
    }

    val now = System.currentTimeMillis()
    if (now - lastOrientationEmitMs < 95L) return
    lastOrientationEmitMs = now

    val totalG = sqrt(filteredGx * filteredGx + filteredGy * filteredGy + filteredGz * filteredGz).coerceAtLeast(0.1f)
    val nx = filteredGx / totalG
    val ny = filteredGy / totalG
    val nz = filteredGz / totalG

    val mountingMode: String
    val rollDeg: Double
    val pitchDeg: Double

    // Phone flat / rear camera pointing down at the ground (gz dominant positive) or screen facing ground (gz dominant negative)
    if (abs(nz) > 0.62f) {
      mountingMode = if (nz >= 0f) "OVERHEAD_DOWN" else "OVERHEAD_UP"
      val refZ = abs(nz)
      rollDeg = atan2((-filteredGx).toDouble(), filteredGz.toDouble()) * (180.0 / PI)
      pitchDeg = atan2((-filteredGy).toDouble(), refZ.toDouble() * totalG) * (180.0 / PI)
    } else {
      // Phone standing upright pointing at a wall / range target
      mountingMode = "WALL_RIG"
      rollDeg = atan2(filteredGx.toDouble(), filteredGy.toDouble()) * (180.0 / PI)
      pitchDeg = atan2(filteredGz.toDouble(), hypot(filteredGx, filteredGy).toDouble()) * (180.0 / PI)
    }

    val map = Arguments.createMap().apply {
      putDouble("rollDeg", Math.round(rollDeg * 10.0) / 10.0)
      putDouble("pitchDeg", Math.round(pitchDeg * 10.0) / 10.0)
      putDouble("gx", (nx * 100.0).toInt() / 100.0)
      putDouble("gy", (ny * 100.0).toInt() / 100.0)
      putDouble("gz", (nz * 100.0).toInt() / 100.0)
      putDouble("totalG", Math.round((totalG / 9.81) * 100.0) / 100.0)
      putString("mountingMode", mountingMode)
    }
    emitEvent(EVENT_ORIENTATION, map)
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    // No-op
  }

  // ── Real Microphone SPL Monitor ──────────────────────────────────────────────

  @ReactMethod
  fun hasAudioPermission(promise: Promise) {
    val granted = ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.RECORD_AUDIO
    ) == PackageManager.PERMISSION_GRANTED
    promise.resolve(granted)
  }

  @ReactMethod
  fun startAudioMonitoring(promise: Promise) {
    shouldResumeAudio = true
    val ok = startAudioInternal()
    promise.resolve(ok)
  }

  private fun startAudioInternal(): Boolean {
    val granted = ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.RECORD_AUDIO
    ) == PackageManager.PERMISSION_GRANTED

    if (!granted) {
      return false
    }

    if (isAudioRunning.get()) {
      return true
    }

    isAudioRunning.set(true)
    audioThread = Thread {
      var recorder: AudioRecord? = null
      try {
        val sampleRate = 16000
        val minBuf = AudioRecord.getMinBufferSize(
          sampleRate,
          AudioFormat.CHANNEL_IN_MONO,
          AudioFormat.ENCODING_PCM_16BIT
        )
        val bufferSize = max(minBuf, 2048)
        recorder = AudioRecord(
          MediaRecorder.AudioSource.MIC,
          sampleRate,
          AudioFormat.CHANNEL_IN_MONO,
          AudioFormat.ENCODING_PCM_16BIT,
          bufferSize
        )

        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
          isAudioRunning.set(false)
          return@Thread
        }

        val samples = ShortArray(1024)
        recorder.startRecording()

        while (isAudioRunning.get()) {
          val read = recorder.read(samples, 0, samples.size)
          if (read > 0) {
            var sumSq = 0.0
            var peak = 0
            for (i in 0 until read) {
              val s = samples[i].toInt()
              val a = if (s < 0) -s else s
              if (a > peak) peak = a
              sumSq += s.toDouble() * s.toDouble()
            }
            val rms = sqrt(sumSq / read).coerceAtLeast(1.0)
            val dbfsRms = (20.0 * log10(rms / 32767.0)).coerceIn(-85.0, 0.0)
            val dbfsPeak = (20.0 * log10(peak.coerceAtLeast(1).toDouble() / 32767.0)).coerceIn(-85.0, 0.0)
            val rmsDb = (dbfsRms + 108.0).coerceIn(28.0, 128.0)
            val peakDb = (dbfsPeak + 108.0).coerceIn(28.0, 130.0)

            val payload = Arguments.createMap().apply {
              putDouble("rmsDb", Math.round(rmsDb * 10.0) / 10.0)
              putDouble("peakDb", Math.round(peakDb * 10.0) / 10.0)
              putDouble("dbfs", Math.round(dbfsRms * 10.0) / 10.0)
              putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
            emitEvent(EVENT_AUDIO, payload)
          }
          Thread.sleep(75)
        }
      } catch (_: Exception) {
        // Handle gracefully on emulator/device without mic
      } finally {
        try {
          recorder?.stop()
        } catch (_: Exception) {
        }
        try {
          recorder?.release()
        } catch (_: Exception) {
        }
        isAudioRunning.set(false)
      }
    }.apply {
      isDaemon = true
      name = "TargetAudioSpl"
      start()
    }

    return true
  }

  private fun stopAudioInternal() {
    isAudioRunning.set(false)
    audioThread?.interrupt()
    audioThread = null
  }

  @ReactMethod
  fun stopAudioMonitoring() {
    shouldResumeAudio = false
    stopAudioInternal()
  }

  // ── Live Camera Preview Capture & Native CV ──────────────────────────────────

  private data class QuadNorm(
    val tlX: Float, val tlY: Float,
    val trX: Float, val trY: Float,
    val brX: Float, val brY: Float,
    val blX: Float, val blY: Float
  )

  private fun parseCornersNorm(map: ReadableMap): QuadNorm {
    fun pt(key: String, defX: Float, defY: Float): Pair<Float, Float> {
      val sub = map.getMap(key) ?: return defX to defY
      return sub.getDouble("x").toFloat() to sub.getDouble("y").toFloat()
    }
    val tl = pt("topLeft", 0.15f, 0.25f)
    val tr = pt("topRight", 0.85f, 0.25f)
    val br = pt("bottomRight", 0.85f, 0.75f)
    val bl = pt("bottomLeft", 0.15f, 0.75f)
    return QuadNorm(tl.first, tl.second, tr.first, tr.second, br.first, br.second, bl.first, bl.second)
  }

  private data class PreviewCaptureTarget(
    val rootView: View,
    val surfaceView: SurfaceView?,
    val textureView: TextureView?,
    val viewWidthPx: Int,
    val viewHeightPx: Int,
    val leftInRoot: Float,
    val topInRoot: Float,
    val scaledWidth: Float,
    val scaledHeight: Float
  )

  private fun findPreviewTarget(activity: Activity): PreviewCaptureTarget? {
    val root = activity.window?.decorView ?: return null
    val rootLoc = IntArray(2)
    root.getLocationInWindow(rootLoc)

    val stack = ArrayDeque<View>()
    stack.addLast(root)
    while (stack.isNotEmpty()) {
      val v = stack.removeFirst()
      if (v.javaClass.name.contains("PreviewView") && v is ViewGroup) {
        for (i in 0 until v.childCount) {
          val child = v.getChildAt(i)
          if (child is TextureView && child.isAvailable && child.width > 0 && child.height > 0) {
            val loc = IntArray(2)
            child.getLocationInWindow(loc)
            return PreviewCaptureTarget(
              rootView = root,
              surfaceView = null,
              textureView = child,
              viewWidthPx = root.width.coerceAtLeast(1),
              viewHeightPx = root.height.coerceAtLeast(1),
              leftInRoot = (loc[0] - rootLoc[0]).toFloat(),
              topInRoot = (loc[1] - rootLoc[1]).toFloat(),
              scaledWidth = (child.width * child.scaleX).coerceAtLeast(1f),
              scaledHeight = (child.height * child.scaleY).coerceAtLeast(1f)
            )
          }
          if (child is SurfaceView && child.holder.surface?.isValid == true && child.width > 0 && child.height > 0) {
            val loc = IntArray(2)
            child.getLocationInWindow(loc)
            return PreviewCaptureTarget(
              rootView = root,
              surfaceView = child,
              textureView = null,
              viewWidthPx = root.width.coerceAtLeast(1),
              viewHeightPx = root.height.coerceAtLeast(1),
              leftInRoot = (loc[0] - rootLoc[0]).toFloat(),
              topInRoot = (loc[1] - rootLoc[1]).toFloat(),
              scaledWidth = (child.width * child.scaleX).coerceAtLeast(1f),
              scaledHeight = (child.height * child.scaleY).coerceAtLeast(1f)
            )
          }
        }
      }
      if (v is ViewGroup) {
        for (i in 0 until v.childCount) {
          stack.addLast(v.getChildAt(i))
        }
      }
    }
    return null
  }

  private fun capturePreviewBitmap(
    maxDim: Int,
    onDone: (bitmap: Bitmap?, target: PreviewCaptureTarget?) -> Unit
  ) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      onDone(null, null)
      return
    }
    mainHandler.post {
      val target = findPreviewTarget(activity)
      if (target == null) {
        onDone(null, null)
        return@post
      }

      val srcW = target.scaledWidth.toInt().coerceAtLeast(16)
      val srcH = target.scaledHeight.toInt().coerceAtLeast(16)
      val scale = min(1.0f, maxDim.toFloat() / max(srcW, srcH).toFloat())
      val outW = (srcW * scale).toInt().coerceAtLeast(64)
      val outH = (srcH * scale).toInt().coerceAtLeast(64)

      if (target.textureView != null) {
        try {
          val bmp = target.textureView.getBitmap(Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888))
          onDone(bmp, target)
        } catch (_: Exception) {
          onDone(null, target)
        }
        return@post
      }

      val sv = target.surfaceView
      if (sv != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        try {
          val bmp = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888)
          PixelCopy.request(
            sv,
            bmp,
            { result ->
              if (result == PixelCopy.SUCCESS) {
                onDone(bmp, target)
              } else {
                bmp.recycle()
                onDone(null, target)
              }
            },
            ensureBgHandler()
          )
        } catch (_: Exception) {
          onDone(null, target)
        }
      } else {
        onDone(null, target)
      }
    }
  }

  @ReactMethod
  fun capturePreviewBase64(maxWidth: Int, jpegQuality: Int, promise: Promise) {
    capturePreviewBitmap(maxWidth.coerceIn(160, 1280)) { bmp, _ ->
      if (bmp == null) {
        promise.resolve(null)
        return@capturePreviewBitmap
      }
      ensureBgHandler().post {
        try {
          val baos = ByteArrayOutputStream()
          bmp.compress(Bitmap.CompressFormat.JPEG, jpegQuality.coerceIn(15, 92), baos)
          val bytes = baos.toByteArray()
          val w = bmp.width
          val h = bmp.height
          bmp.recycle()
          val res = Arguments.createMap().apply {
            putString("base64", Base64.encodeToString(bytes, Base64.NO_WRAP))
            putInt("width", w)
            putInt("height", h)
          }
          promise.resolve(res)
        } catch (e: Exception) {
          bmp.recycle()
          promise.resolve(null)
        }
      }
    }
  }

  /**
   * Computes 3x3 homography H mapping unit target square [(-1,-1), (1,-1), (1,1), (-1,1)]
   * to pixel coords [(x0,y0), (x1,y1), (x2,y2), (x3,y3)]. Returns 9-float row-major array or null.
   */
  private fun computeQuadHomography(
    x0: Float, y0: Float,
    x1: Float, y1: Float,
    x2: Float, y2: Float,
    x3: Float, y3: Float
  ): DoubleArray? {
    val src = arrayOf(
      -1.0 to -1.0,
      1.0 to -1.0,
      1.0 to 1.0,
      -1.0 to 1.0
    )
    val dst = arrayOf(
      x0.toDouble() to y0.toDouble(),
      x1.toDouble() to y1.toDouble(),
      x2.toDouble() to y2.toDouble(),
      x3.toDouble() to y3.toDouble()
    )
    val a = Array(8) { DoubleArray(9) }
    for (i in 0 until 4) {
      val (u, v) = src[i]
      val (x, y) = dst[i]
      val r0 = i * 2
      a[r0][0] = u; a[r0][1] = v; a[r0][2] = 1.0
      a[r0][6] = -x * u; a[r0][7] = -x * v; a[r0][8] = x

      val r1 = r0 + 1
      a[r1][3] = u; a[r1][4] = v; a[r1][5] = 1.0
      a[r1][6] = -y * u; a[r1][7] = -y * v; a[r1][8] = y
    }

    for (col in 0 until 8) {
      var maxRow = col
      var maxVal = abs(a[col][col])
      for (r in col + 1 until 8) {
        if (abs(a[r][col]) > maxVal) {
          maxVal = abs(a[r][col])
          maxRow = r
        }
      }
      if (maxVal < 1e-9) return null
      val tmp = a[col]; a[col] = a[maxRow]; a[maxRow] = tmp
      val pivot = a[col][col]
      for (c in col..8) a[col][c] /= pivot
      for (r in 0 until 8) {
        if (r == col) continue
        val f = a[r][col]
        if (f == 0.0) continue
        for (c in col..8) a[r][c] -= f * a[col][c]
      }
    }

    return doubleArrayOf(
      a[0][8], a[1][8], a[2][8],
      a[3][8], a[4][8], a[5][8],
      a[6][8], a[7][8], 1.0
    )
  }

  private fun sampleWarpedQuadLuma(
    bitmap: Bitmap,
    quadInBitmapPx: FloatArray
  ): FloatArray? {
    val w = bitmap.width
    val h = bitmap.height
    if (w < 16 || h < 16) return null
    val hMat = computeQuadHomography(
      quadInBitmapPx[0], quadInBitmapPx[1],
      quadInBitmapPx[2], quadInBitmapPx[3],
      quadInBitmapPx[4], quadInBitmapPx[5],
      quadInBitmapPx[6], quadInBitmapPx[7]
    ) ?: return null

    val pixels = IntArray(w * h)
    bitmap.getPixels(pixels, 0, w, 0, 0, w, h)

    val grid = FloatArray(PATCH_SIZE * PATCH_SIZE)
    for (gy in 0 until PATCH_SIZE) {
      val v = (gy.toDouble() / (PATCH_SIZE - 1)) * 2.0 - 1.0
      for (gx in 0 until PATCH_SIZE) {
        val u = (gx.toDouble() / (PATCH_SIZE - 1)) * 2.0 - 1.0
        val denom = hMat[6] * u + hMat[7] * v + hMat[8]
        val px = ((hMat[0] * u + hMat[1] * v + hMat[2]) / denom).toInt().coerceIn(0, w - 1)
        val py = ((hMat[3] * u + hMat[4] * v + hMat[5]) / denom).toInt().coerceIn(0, h - 1)
        val argb = pixels[py * w + px]
        val r = (argb shr 16) and 0xFF
        val g = (argb shr 8) and 0xFF
        val b = argb and 0xFF
        grid[gy * PATCH_SIZE + gx] = 0.299f * r + 0.587f * g + 0.114f * b
      }
    }
    return grid
  }

  private fun computeImageMetrics(grid: FloatArray): Triple<Double, Double, Double> {
    var sum = 0.0
    for (v in grid) sum += v
    val mean = sum / grid.size

    var varSum = 0.0
    var gradSum = 0.0
    var gradCount = 0
    for (y in 0 until PATCH_SIZE) {
      for (x in 0 until PATCH_SIZE) {
        val idx = y * PATCH_SIZE + x
        val d = grid[idx] - mean
        varSum += d * d
        if (x + 1 < PATCH_SIZE && y + 1 < PATCH_SIZE) {
          val gx = abs(grid[idx + 1] - grid[idx])
          val gy = abs(grid[idx + PATCH_SIZE] - grid[idx])
          gradSum += gx + gy
          gradCount++
        }
      }
    }
    val stdDev = sqrt(varSum / grid.size)
    val contrastScore = ((stdDev / 65.0) * 100.0).coerceIn(0.0, 100.0)
    val sharpnessScore = if (gradCount > 0) ((gradSum / gradCount / 36.0) * 100.0).coerceIn(0.0, 100.0) else 0.0
    return Triple(mean, contrastScore, sharpnessScore)
  }

  private fun quadScreenToBitmapPx(
    quad: QuadNorm,
    bmpW: Int,
    bmpH: Int,
    target: PreviewCaptureTarget?
  ): FloatArray {
    if (target == null) {
      return floatArrayOf(
        quad.tlX * bmpW, quad.tlY * bmpH,
        quad.trX * bmpW, quad.trY * bmpH,
        quad.brX * bmpW, quad.brY * bmpH,
        quad.blX * bmpW, quad.blY * bmpH
      )
    }
    fun mapPt(nx: Float, ny: Float): Pair<Float, Float> {
      val rootX = nx * target.viewWidthPx
      val rootY = ny * target.viewHeightPx
      val bx = ((rootX - target.leftInRoot) / target.scaledWidth) * bmpW
      val by = ((rootY - target.topInRoot) / target.scaledHeight) * bmpH
      return bx.coerceIn(0f, (bmpW - 1).toFloat()) to by.coerceIn(0f, (bmpH - 1).toFloat())
    }
    val p0 = mapPt(quad.tlX, quad.tlY)
    val p1 = mapPt(quad.trX, quad.trY)
    val p2 = mapPt(quad.brX, quad.brY)
    val p3 = mapPt(quad.blX, quad.blY)
    return floatArrayOf(p0.first, p0.second, p1.first, p1.second, p2.first, p2.second, p3.first, p3.second)
  }

  private fun analyzeGridInternal(grid: FloatArray, mode: String, deltaThreshold: Int): WritableMap {
    val (meanLuma, contrastScore, sharpnessScore) = computeImageMetrics(grid)

    val result = Arguments.createMap().apply {
      putDouble("lumaAvg", Math.round(meanLuma * 10.0) / 10.0)
      putDouble("contrastScore", Math.round(contrastScore * 10.0) / 10.0)
      putDouble("sharpnessScore", Math.round(sharpnessScore * 10.0) / 10.0)
      putString("mode", mode)
      putBoolean("hasImpact", false)
      putBoolean("cameraMoved", false)
      putBoolean("baselineLocked", false)
    }

    if (meanLuma < 1.5 && contrastScore < 1.0) {
      result.putString("message", "LOW_LUMA_OR_OCCLUDED")
      result.putBoolean("baselineLocked", synchronized(cvLock) { baselineLuma != null })
      return result
    }

    synchronized(cvLock) {
      if (mode == "SET_BASELINE" || baselineLuma == null) {
        baselineLuma = grid.copyOf()
        confirmedHitMask = BooleanArray(PATCH_SIZE * PATCH_SIZE)
        baselineTimestampMs = System.currentTimeMillis()
        result.putBoolean("baselineLocked", true)
        result.putString("message", "BASELINE_LOCKED")
        return result
      }

      val base = baselineLuma!!
      val hitMask = confirmedHitMask ?: BooleanArray(PATCH_SIZE * PATCH_SIZE).also { confirmedHitMask = it }
      result.putBoolean("baselineLocked", true)

      var totalDiff = 0.0
      val darkChanged = BooleanArray(PATCH_SIZE * PATCH_SIZE)
      val darkGain = FloatArray(PATCH_SIZE * PATCH_SIZE)
      var changedCount = 0

      val effThreshold = deltaThreshold.coerceIn(14, 70).toFloat()

      for (y in 3 until PATCH_SIZE - 3) {
        for (x in 3 until PATCH_SIZE - 3) {
          val idx = y * PATCH_SIZE + x
          val diff = abs(base[idx] - grid[idx])
          totalDiff += diff
          if (hitMask[idx]) continue
          // Dark perforation: pixel got darker than baseline and is relatively dark overall
          val darkening = base[idx] - grid[idx]
          if (darkening >= effThreshold && grid[idx] < 165f) {
            darkChanged[idx] = true
            darkGain[idx] = darkening
            changedCount++
          }
        }
      }

      val meanAbsDiff = totalDiff / ((PATCH_SIZE - 6) * (PATCH_SIZE - 6))
      result.putDouble("meanAbsDiff", Math.round(meanAbsDiff * 10.0) / 10.0)

      // Camera shake / scene reset guard
      if (meanAbsDiff > 24.0 || changedCount > (PATCH_SIZE * PATCH_SIZE) * 0.20) {
        result.putBoolean("cameraMoved", true)
        result.putString("message", "CAMERA_MOVED")
        return result
      }

      // Connected component clustering for real hole candidate
      val visited = BooleanArray(PATCH_SIZE * PATCH_SIZE)
      var bestWeight = 0.0
      var bestPixels: IntArray? = null
      var bestSumX = 0.0
      var bestSumY = 0.0
      var bestCount = 0

      val queue = IntArray(4096)
      for (y in 4 until PATCH_SIZE - 4) {
        for (x in 4 until PATCH_SIZE - 4) {
          val startIdx = y * PATCH_SIZE + x
          if (!darkChanged[startIdx] || visited[startIdx]) continue

          var head = 0
          var tail = 0
          queue[tail++] = startIdx
          visited[startIdx] = true

          var wSum = 0.0
          var wxSum = 0.0
          var wySum = 0.0
          var cCount = 0
          val clusterList = IntArray(700)

          while (head < tail) {
            val cur = queue[head++]
            val cx = cur % PATCH_SIZE
            val cy = cur / PATCH_SIZE
            val w = darkGain[cur].toDouble()
            wSum += w
            wxSum += cx * w
            wySum += cy * w
            if (cCount < clusterList.size) clusterList[cCount] = cur
            cCount++

            for (dy in -1..1) {
              for (dx in -1..1) {
                if (dx == 0 && dy == 0) continue
                val nx = cx + dx
                val ny = cy + dy
                if (nx in 3 until PATCH_SIZE - 3 && ny in 3 until PATCH_SIZE - 3) {
                  val nIdx = ny * PATCH_SIZE + nx
                  if (darkChanged[nIdx] && !visited[nIdx] && tail < queue.size) {
                    visited[nIdx] = true
                    queue[tail++] = nIdx
                  }
                }
              }
            }
          }

          // Pellet/bullet hole cluster size filter (not single-pixel noise, not huge hand shadow)
          if (cCount in 4..650 && wSum > bestWeight) {
            bestWeight = wSum
            bestPixels = clusterList
            bestCount = cCount
            bestSumX = wxSum / wSum
            bestSumY = wySum / wSum
          }
        }
      }

      if (bestPixels != null && bestWeight > 120.0) {
        val normU = (bestSumX / (PATCH_SIZE - 1)) * 2.0 - 1.0
        val normV = (bestSumY / (PATCH_SIZE - 1)) * 2.0 - 1.0

        // Mark hole neighborhood so it isn't re-triggered on next frame
        val cx = bestSumX.toInt()
        val cy = bestSumY.toInt()
        for (dy in -5..5) {
          for (dx in -5..5) {
            val mx = (cx + dx).coerceIn(0, PATCH_SIZE - 1)
            val my = (cy + dy).coerceIn(0, PATCH_SIZE - 1)
            hitMask[my * PATCH_SIZE + mx] = true
            base[my * PATCH_SIZE + mx] = grid[my * PATCH_SIZE + mx]
          }
        }

        result.putBoolean("hasImpact", true)
        result.putDouble("normU", normU)
        result.putDouble("normV", normV)
        result.putInt("clusterPixels", bestCount)
        result.putDouble("impactConfidence", min(0.99, bestWeight / 800.0 + 0.55))
        result.putString("message", "OPTICAL_HOLE_DETECTED")
      } else {
        result.putString("message", "SCAN_CLEAN")
      }
      return result
    }
  }

  @ReactMethod
  fun resetCvBaseline() {
    synchronized(cvLock) {
      baselineLuma = null
      confirmedHitMask = null
      baselineTimestampMs = 0L
    }
  }

  @ReactMethod
  fun analyzeLivePreview(cornersNorm: ReadableMap, mode: String, deltaThreshold: Int, promise: Promise) {
    val quad = parseCornersNorm(cornersNorm)
    capturePreviewBitmap(480) { bmp, target ->
      if (bmp == null) {
        promise.resolve(Arguments.createMap().apply {
          putBoolean("previewUnavailable", true)
          putString("message", "PREVIEW_UNAVAILABLE")
        })
        return@capturePreviewBitmap
      }
      ensureBgHandler().post {
        try {
          val quadPx = quadScreenToBitmapPx(quad, bmp.width, bmp.height, target)
          val grid = sampleWarpedQuadLuma(bmp, quadPx)
          bmp.recycle()
          if (grid == null) {
            promise.resolve(Arguments.createMap().apply {
              putBoolean("previewUnavailable", true)
              putString("message", "INVALID_QUAD")
            })
            return@post
          }
          val res = analyzeGridInternal(grid, mode, deltaThreshold)
          promise.resolve(res)
        } catch (e: Exception) {
          bmp.recycle()
          promise.resolve(Arguments.createMap().apply {
            putBoolean("previewUnavailable", true)
            putString("message", e.message ?: "CV_ERROR")
          })
        }
      }
    }
  }

  @ReactMethod
  fun analyzeBase64Frame(base64Jpeg: String, cornersNorm: ReadableMap, mode: String, deltaThreshold: Int, promise: Promise) {
    val quad = parseCornersNorm(cornersNorm)
    ensureBgHandler().post {
      try {
        val raw = Base64.decode(base64Jpeg, Base64.DEFAULT)
        val opts = BitmapFactory.Options().apply { inSampleSize = 2 }
        val bmp = BitmapFactory.decodeByteArray(raw, 0, raw.size, opts)
        if (bmp == null) {
          promise.resolve(Arguments.createMap().apply {
            putBoolean("previewUnavailable", true)
            putString("message", "DECODE_FAILED")
          })
          return@post
        }
        val quadPx = quadScreenToBitmapPx(quad, bmp.width, bmp.height, null)
        val grid = sampleWarpedQuadLuma(bmp, quadPx)
        bmp.recycle()
        if (grid == null) {
          promise.resolve(Arguments.createMap().apply {
            putBoolean("previewUnavailable", true)
            putString("message", "INVALID_QUAD")
          })
          return@post
        }
        promise.resolve(analyzeGridInternal(grid, mode, deltaThreshold))
      } catch (e: Exception) {
        promise.resolve(Arguments.createMap().apply {
          putBoolean("previewUnavailable", true)
          putString("message", e.message ?: "CV_ERROR")
        })
      }
    }
  }

  /**
   * Detects dominant dark circular bullseye / high-contrast object near center of preview
   * and returns suggested screen-normalized 4 corners (0..1) plus detection confidence.
   */
  @ReactMethod
  fun findTargetBounds(promise: Promise) {
    capturePreviewBitmap(320) { bmp, target ->
      if (bmp == null) {
        promise.resolve(Arguments.createMap().apply {
          putBoolean("found", false)
          putString("reason", "PREVIEW_UNAVAILABLE")
        })
        return@capturePreviewBitmap
      }
      ensureBgHandler().post {
        try {
          val w = bmp.width
          val h = bmp.height
          val pixels = IntArray(w * h)
          bmp.getPixels(pixels, 0, w, 0, 0, w, h)
          bmp.recycle()

          val luma = FloatArray(w * h)
          val x0 = (w * 0.10).toInt()
          val x1 = (w * 0.90).toInt()
          val y0 = (h * 0.14).toInt()
          val y1 = (h * 0.82).toInt()

          var sum = 0.0
          var minL = 255f
          var maxL = 0f
          var count = 0
          for (y in y0 until y1) {
            for (x in x0 until x1) {
              val argb = pixels[y * w + x]
              val l = 0.299f * ((argb shr 16) and 0xFF) + 0.587f * ((argb shr 8) and 0xFF) + 0.114f * (argb and 0xFF)
              luma[y * w + x] = l
              sum += l
              if (l < minL) minL = l
              if (l > maxL) maxL = l
              count++
            }
          }

          val meanL = (sum / max(1, count)).toFloat()
          val dynamicRange = maxL - minL
          if (dynamicRange < 42f) {
            promise.resolve(Arguments.createMap().apply {
              putBoolean("found", false)
              putString("reason", "LOW_SCENE_CONTRAST")
              putDouble("contrastRange", dynamicRange.toDouble())
            })
            return@post
          }

          // Threshold for dark bullseye / dark mark relative to scene average & minimum
          val darkThresh = min(meanL * 0.62f, minL + dynamicRange * 0.34f)
          val visited = BooleanArray(w * h)
          val queue = IntArray(w * h)

          var bestScore = 0.0
          var bestCx = 0.0
          var bestCy = 0.0
          var bestMinX = w
          var bestMaxX = 0
          var bestMinY = h
          var bestMaxY = 0
          var bestCount = 0

          val step = 2
          for (y in y0 until y1 step step) {
            for (x in x0 until x1 step step) {
              val start = y * w + x
              if (visited[start] || luma[start] > darkThresh) continue

              var head = 0
              var tail = 0
              queue[tail++] = start
              visited[start] = true

              var cCount = 0
              var sX = 0.0
              var sY = 0.0
              var cMinX = x; var cMaxX = x
              var cMinY = y; var cMaxY = y

              while (head < tail) {
                val cur = queue[head++]
                val cx = cur % w
                val cy = cur / w
                cCount++
                sX += cx
                sY += cy
                if (cx < cMinX) cMinX = cx
                if (cx > cMaxX) cMaxX = cx
                if (cy < cMinY) cMinY = cy
                if (cy > cMaxY) cMaxY = cy

                val nbrs = intArrayOf(cur - 1, cur + 1, cur - w, cur + w)
                for (n in nbrs) {
                  val nx = n % w
                  val ny = n / w
                  if (nx in x0 until x1 && ny in y0 until y1 && !visited[n] && luma[n] <= darkThresh && tail < queue.size) {
                    visited[n] = true
                    queue[tail++] = n
                  }
                }
              }

              val bw = (cMaxX - cMinX + 1).toDouble()
              val bh = (cMaxY - cMinY + 1).toDouble()
              val aspect = if (bh > 0) bw / bh else 0.0
              val areaRatio = cCount.toDouble() / (w * h)
              // Prefer compact circular dark bullseye (aspect near 1, reasonable size)
              if (areaRatio in 0.008..0.28 && aspect in 0.55..1.8) {
                val centerBias = 1.0 - min(0.7, hypot(sX / cCount - w / 2.0, sY / cCount - h / 2.0) / max(w, h))
                val compactScore = (1.0 - abs(1.0 - aspect) * 0.6) * cCount * centerBias
                if (compactScore > bestScore) {
                  bestScore = compactScore
                  bestCount = cCount
                  bestCx = sX / cCount
                  bestCy = sY / cCount
                  bestMinX = cMinX
                  bestMaxX = cMaxX
                  bestMinY = cMinY
                  bestMaxY = cMaxY
                }
              }
            }
          }

          if (bestCount < 80) {
            promise.resolve(Arguments.createMap().apply {
              putBoolean("found", false)
              putString("reason", "NO_BULLSEYE_CLUSTER")
              putDouble("contrastRange", dynamicRange.toDouble())
            })
            return@post
          }

          // ISSF card is larger than black bullseye (~1.95x bullseye radius)
          // Compute exact square bounds in root window pixel coordinates so AUTO-LOCK always produces 1:1 ASP inside open viewport
          val viewW = target?.viewWidthPx?.toDouble() ?: w.toDouble()
          val viewH = target?.viewHeightPx?.toDouble() ?: h.toDouble()
          val centerRootX = if (target != null) target.leftInRoot + (bestCx / w) * target.scaledWidth else bestCx
          val centerRootY = if (target != null) target.topInRoot + (bestCy / h) * target.scaledHeight else bestCy
          val bullWRoot = if (target != null) ((bestMaxX - bestMinX) / 2.0) * (target.scaledWidth / w) else (bestMaxX - bestMinX) / 2.0
          val bullHRoot = if (target != null) ((bestMaxY - bestMinY) / 2.0) * (target.scaledHeight / h) else (bestMaxY - bestMinY) / 2.0
          val bullRootRadius = max(bullWRoot, bullHRoot)

          val minXRoot = viewW * 0.06
          val maxXRoot = viewW * 0.94
          val minYRoot = viewH * 0.17
          val maxYRoot = viewH * 0.74
          val maxSquareHalf = min((maxXRoot - minXRoot) * 0.48, (maxYRoot - minYRoot) * 0.48)
          val minSquareHalf = viewW * 0.16
          val outerHalfRoot = (bullRootRadius * 1.9).coerceIn(minSquareHalf, maxSquareHalf)

          val clampedCx = centerRootX.coerceIn(minXRoot + outerHalfRoot, maxXRoot - outerHalfRoot)
          val clampedCy = centerRootY.coerceIn(minYRoot + outerHalfRoot, maxYRoot - outerHalfRoot)

          fun rootPxToNorm(rx: Double, ry: Double): WritableMap {
            return Arguments.createMap().apply {
              putDouble("x", (rx / viewW).coerceIn(0.04, 0.96))
              putDouble("y", (ry / viewH).coerceIn(0.15, 0.76))
            }
          }

          val res = Arguments.createMap().apply {
            putBoolean("found", true)
            putMap("topLeft", rootPxToNorm(clampedCx - outerHalfRoot, clampedCy - outerHalfRoot))
            putMap("topRight", rootPxToNorm(clampedCx + outerHalfRoot, clampedCy - outerHalfRoot))
            putMap("bottomRight", rootPxToNorm(clampedCx + outerHalfRoot, clampedCy + outerHalfRoot))
            putMap("bottomLeft", rootPxToNorm(clampedCx - outerHalfRoot, clampedCy + outerHalfRoot))
            putDouble("confidence", min(0.98, 0.65 + (dynamicRange / 255.0) * 0.35))
          }
          promise.resolve(res)
        } catch (e: Exception) {
          promise.resolve(Arguments.createMap().apply {
            putBoolean("found", false)
            putString("reason", e.message ?: "AUTO_FIND_ERROR")
          })
        }
      }
    }
  }

  override fun onHostResume() {
    if (isSensorActive) {
      sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let { accel ->
        sensorManager?.registerListener(this, accel, SensorManager.SENSOR_DELAY_UI)
      }
    }
    if (shouldResumeAudio) {
      startAudioInternal()
    }
  }

  override fun onHostPause() {
    if (isSensorActive) {
      sensorManager?.unregisterListener(this)
    }
    stopAudioInternal()
  }

  override fun onHostDestroy() {
    stopOrientationMonitoring()
    stopAudioMonitoring()
    bgThread?.quitSafely()
    bgThread = null
    bgHandler = null
  }
}

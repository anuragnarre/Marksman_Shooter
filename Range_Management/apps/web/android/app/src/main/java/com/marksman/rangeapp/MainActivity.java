package com.marksman.rangeapp;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    /**
     * Intercept the hardware Back button.
     *
     * Capacitor forwards this as a "backButton" JS event to the web layer
     * (handled by our DashboardLayout useEffect with @capacitor/app).
     * However, if the JS layer does NOT consume it (e.g., during cold start),
     * the default BridgeActivity behaviour is to call finish(), which kills
     * the activity.  We override here to:
     *   1. Always fire the JS "backButton" event first (via super).
     *   2. If we are at the root of the WebView history, navigate to /dashboard
     *      inside the WebView rather than closing the app.
     *
     * This means the RSO can never accidentally quit the app mid-operation
     * by tapping Back.
     */
    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // Ask the WebView if it can go back within SPA history
        if (getBridge() != null && getBridge().getWebView() != null) {
            if (getBridge().getWebView().canGoBack()) {
                getBridge().getWebView().goBack();
                return;
            }
            String currentUrl = getBridge().getWebView().getUrl();
            if (currentUrl == null || (!currentUrl.contains("/dashboard") && !currentUrl.contains("/auth/login"))) {
                getBridge().getWebView().evaluateJavascript("window.location.href='/dashboard/'", null);
                return;
            }
        }
        // Intentionally NOT calling super.onBackPressed() on root /dashboard to prevent closing the app mid-operation
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attrib = getWindow().getAttributes();
            attrib.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attrib);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }

        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }
}

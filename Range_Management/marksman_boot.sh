#!/system/bin/sh
# Magisk Boot Script to start Marksman Servers & Tunnel on Boot

# Wait for boot to finish
until [ "$(getprop sys.boot_completed)" = "1" ]; do sleep 5; done
sleep 15

PROJECT_DIR="/data/data/com.termux/files/home/Marksman"
LOG_DIR="$PROJECT_DIR/logs"

# We must ensure the correct permissions since we'll run stuff as u0_a153
su - u0_a153 -c "mkdir -p $LOG_DIR"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_DIR/boot.log
}

log "Starting Marksman services from Magisk..."

# Start API
su - u0_a153 -c "export PREFIX=/data/data/com.termux/files/usr; export PATH=\$PREFIX/bin:\$PATH; cd $PROJECT_DIR/apps/api && nohup npm run start:prod > $LOG_DIR/api.log 2>&1 &"

# Start Web (Frontend)
su - u0_a153 -c "export PREFIX=/data/data/com.termux/files/usr; export PATH=\$PREFIX/bin:\$PATH; cd $PROJECT_DIR/apps/web && nohup npm run start > $LOG_DIR/web.log 2>&1 &"

# Watchdog for Cloudflared tunnel
while true; do
    ping -c 1 8.8.8.8 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        if ! pgrep cloudflared > /dev/null; then
            log "Internet is UP but tunnel is down. Starting tunnel..."
            su - u0_a153 -c "export PREFIX=/data/data/com.termux/files/usr; export PATH=\$PREFIX/bin:\$PATH; cd $PROJECT_DIR && nohup cloudflared tunnel --config config.yml run > $LOG_DIR/cloudflared.log 2>&1 &"
        fi
    else
        log "Internet is DOWN. Killing tunnel..."
        pkill cloudflared
    fi
    sleep 10
done &

#!/bin/sh
set -eu
cd /workspace

if ! curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  npm run dev >>/tmp/app-startup.log 2>&1 &
  i=0
  while [ "$i" -lt 40 ]; do
    if curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8080/; then
      break
    fi
    i=$((i + 1))
    sleep 0.5
  done
fi

if [ ! -f /tmp/cf.pid ] || ! kill -0 "$(cat /tmp/cf.pid 2>/dev/null)" 2>/dev/null; then
  nohup /tmp/start-tunnel.sh >/tmp/cf.log 2>&1 &
  echo $! >/tmp/cf.pid
  sleep 5
fi

if [ -f /tmp/cf.log ]; then
  grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf.log | tail -1 > /workspace/PUBLIC_URL.txt || true
fi

exit 0

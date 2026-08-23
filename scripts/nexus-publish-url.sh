#!/bin/bash
TOKEN=$(cat /root/.nexus-gh-token)
REPO=Fifenya/nexus-redirect
URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /var/log/nexus-tunnel.log | tail -1)
[ -z "$URL" ] && exit 0
SHA=$(curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/$REPO/contents/docs/url.txt \
  | grep -o '"sha": *"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
B64=$(echo -n "$URL" | base64 -w0)
if [ -n "$SHA" ]; then SHA_PART=",\"sha\":\"$SHA\""; else SHA_PART=""; fi
curl -s -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"message\":\"auto: tunnel url\",\"content\":\"$B64\",\"path\":\"docs/url.txt\"$SHA_PART}" \
  https://api.github.com/repos/$REPO/contents/docs/url.txt | grep -o '"message"[^,]*' | head -2

FROM alpine:3.22 AS tools
RUN apk add --no-cache ffmpeg imagemagick

FROM n8nio/n8n:1.76.1
# Copy all shared libraries from Alpine (needed by ffmpeg/imagemagick)
COPY --from=tools /usr/lib/ /usr/lib/
COPY --from=tools /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=tools /usr/bin/ffprobe /usr/bin/ffprobe
COPY --from=tools /usr/bin/convert /usr/bin/convert
COPY --from=tools /usr/bin/magick /usr/bin/magick
COPY --from=tools /etc/ImageMagick-7/ /etc/ImageMagick-7/

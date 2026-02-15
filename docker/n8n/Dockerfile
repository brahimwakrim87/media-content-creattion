FROM alpine:3.22 AS tools
RUN apk add --no-cache ffmpeg imagemagick

FROM n8nio/n8n:latest
COPY --from=tools /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=tools /usr/bin/ffprobe /usr/bin/ffprobe
COPY --from=tools /usr/bin/convert /usr/bin/convert
COPY --from=tools /usr/bin/magick /usr/bin/magick
COPY --from=tools /usr/lib/libavcodec* /usr/lib/
COPY --from=tools /usr/lib/libavformat* /usr/lib/
COPY --from=tools /usr/lib/libavutil* /usr/lib/
COPY --from=tools /usr/lib/libswscale* /usr/lib/
COPY --from=tools /usr/lib/libswresample* /usr/lib/
COPY --from=tools /usr/lib/libavfilter* /usr/lib/
COPY --from=tools /usr/lib/libavdevice* /usr/lib/
COPY --from=tools /usr/lib/libpostproc* /usr/lib/
COPY --from=tools /usr/lib/libMagick* /usr/lib/
COPY --from=tools /usr/lib/libgomp* /usr/lib/
COPY --from=tools /usr/lib/libx26* /usr/lib/
COPY --from=tools /usr/lib/libvpx* /usr/lib/
COPY --from=tools /usr/lib/libopus* /usr/lib/
COPY --from=tools /usr/lib/libvorbis* /usr/lib/
COPY --from=tools /usr/lib/libogg* /usr/lib/
COPY --from=tools /usr/lib/libmp3lame* /usr/lib/
COPY --from=tools /usr/lib/libfdk-aac* /usr/lib/
COPY --from=tools /usr/lib/libtheora* /usr/lib/
COPY --from=tools /usr/lib/libwebp* /usr/lib/
COPY --from=tools /usr/lib/libaom* /usr/lib/
COPY --from=tools /usr/lib/libdav1d* /usr/lib/
COPY --from=tools /usr/lib/librav1e* /usr/lib/
COPY --from=tools /usr/lib/libSvtAv1* /usr/lib/
COPY --from=tools /etc/ImageMagick-7/ /etc/ImageMagick-7/

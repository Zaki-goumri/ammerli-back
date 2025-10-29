#!/bin/sh

# Start MinIO server in the background
minio server /data --console-address ":9001" &

# Get MinIO process ID
MINIO_PID=$!

# Wait for MinIO to be ready
echo "Waiting for MinIO to start..."
sleep 10

echo "Configuring MinIO client..."
# Use the mc that should be included in the image
mc alias set myminio http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}
echo "Configuration complete"

# Create bucket (ignore if exists)
echo "Creating bucket: ${BUCKET_NAME:-mybucket}"
mc mb myminio/${BUCKET_NAME:-mybucket} --ignore-existing
echo "Bucket creation complete"

# Set bucket to public
echo "Setting bucket to public..."
mc anonymous set download myminio/${BUCKET_NAME:-mybucket}
echo "Bucket set to public"

echo "All done! Bucket ${BUCKET_NAME:-mybucket} is ready"

# Keep MinIO running in foreground
wait $MINIO_PID

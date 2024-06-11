#!/bin/sh

# This finds the Nginx container ID of the container in the same docker compose project and executes the Nginx reload command

# Get the project label of the current container
my_project_label=$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' $(hostname))

# Find the Nginx container ID
nginx_container_id=$(docker ps -q --filter "label=com.docker.compose.project=${my_project_label}" --filter "label=com.docker.compose.service=nginx")

# Execute Nginx reload
docker exec $nginx_container_id nginx -s reload

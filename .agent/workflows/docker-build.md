---
description: How to build and run the Docker container
---

To build and run the application using Docker, follow these steps:

1. **Build the Docker image**
   Run the following command in the root directory of the project:

   ```bash
   docker build -t home-dashboard .
   ```

   - `-t home-dashboard`: Tags the image with the name "home-dashboard".
   - `.`: Specifies the current directory as the build context.

2. **Run the Docker container**
   Once the build is complete, you can run the container with:

   ```bash
   docker run -p 3000:3000 home-dashboard
   ```

   - `-p 3000:3000`: Maps port 3000 of the container to port 3000 on your host machine.
   - `home-dashboard`: The name of the image to run.

3. **Access the application**
   Open your browser and navigate to `http://localhost:3000`.

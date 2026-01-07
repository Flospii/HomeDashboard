# Home Dashboard

A modern, glassmorphism-style dashboard for Raspberry Pi, featuring a clock, weather, and news feed with dynamic backgrounds.

## Local Development

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

---

## Deployment to Raspberry Pi

The recommended way to deploy is using **Docker Compose**.

### Method 1: Source-based Deployment (Git)

Use this if you want to clone the repository directly on your Pi.

1. **Clone and Build**:
   ```bash
   git clone <your-repo-url>
   cd HomeDashboard
   docker-compose up -d --build
   ```

### Method 2: Image-only Deployment (Registry)

Use this if you want to keep your Pi clean and only use the `docker-compose.yml` file.

1. **Build and Push (Local Machine)**:
   ```bash
   docker buildx build --platform linux/arm64 -t <your-username>/home-dashboard:latest --push .
   ```
2. **Deploy (Raspberry Pi)**:
   Copy `docker-compose.yml` to your Pi and run:
   ```bash
   docker-compose up -d
   ```

---

## Displaying on a Monitor (Kiosk Mode)

To show the dashboard in fullscreen without browser borders on a monitor attached to your Pi:

1. **Run Chromium in Kiosk Mode**:

   ```bash
   chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars http://localhost:3000
   ```

2. **Auto-start on Boot**:
   Edit `~/.config/lxsession/LXDE-pi/autostart` and add:
   ```text
   @xset s off
   @xset -dpms
   @xset s noblank
   @chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars http://localhost:3000
   ```

---

## Updating the Application

### Method 1 (Source-based)

```bash
git pull
docker-compose up -d --build
```

### Method 2 (Image-only)

1. **Local**: Build and push new image.
2. **Pi**: `docker-compose pull && docker-compose up -d`

---

## Persistent Data

Configuration and backgrounds are stored in the `dashboard-data` volume, mapped to `/app/data` in the container.

# Argo Tunnel Setup Guide

Detailed guide for setting up Cloudflare Argo Tunnel to connect your Chicago VPS backend to Cloudflare's Edge network.

## 📋 What is Argo Tunnel?

Argo Tunnel creates a secure, encrypted connection between your origin server (Chicago VPS) and Cloudflare's network **without exposing your server's IP address** to the public internet.

### Benefits

✅ **Security**: No inbound ports need to be open on your VPS  
✅ **DDoS Protection**: Traffic goes through Cloudflare's network  
✅ **No Public IP Needed**: Works behind NAT/firewall  
✅ **Optimized Routing**: Cloudflare's Argo Smart Routing for faster connections  
✅ **Easy SSL/TLS**: Automatic HTTPS with Cloudflare certificates  

---

## Prerequisites

- ✅ Chicago VPS with SSH access
- ✅ FastAPI backend running (or ready to run)
- ✅ Cloudflare account with domain added
- ✅ Root or sudo access on VPS

---

## Installation

### Step 1: SSH into Your VPS

```bash
ssh your-username@your-vps-ip
```

### Step 2: Install cloudflared

#### For Ubuntu/Debian (x64)

```bash
# Download the latest release
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify installation
cloudflared --version
```

#### For CentOS/RHEL

```bash
# Download
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm

# Install
sudo rpm -i cloudflared-linux-x86_64.rpm

# Verify
cloudflared --version
```

#### Alternative: Install via Package Manager

```bash
# Add Cloudflare's package repository
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null

echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Update and install
sudo apt update
sudo apt install cloudflared
```

---

## Configuration

### Step 3: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

**What happens:**
1. A URL will be displayed in the terminal
2. Copy and paste it into your browser
3. Login to Cloudflare
4. Select the domain you want to use
5. Authorize the tunnel

**Result:** A certificate file is saved to `~/.cloudflared/cert.pem`

### Step 4: Create a Tunnel

```bash
# Create tunnel named "illiniguide-backend"
cloudflared tunnel create illiniguide-backend
```

**Output:**
```
Tunnel credentials written to /home/user/.cloudflared/<TUNNEL-ID>.json
Created tunnel illiniguide-backend with id <TUNNEL-ID>
```

**Important:** Save the `<TUNNEL-ID>` - you'll need it!

### Step 5: Create Configuration File

Create `~/.cloudflared/config.yml`:

```bash
# Create directory if it doesn't exist
mkdir -p ~/.cloudflared

# Create config file
nano ~/.cloudflared/config.yml
```

**Configuration:**

```yaml
# Tunnel ID (replace with your actual ID)
tunnel: <YOUR-TUNNEL-ID>

# Path to credentials file
credentials-file: /home/your-username/.cloudflared/<YOUR-TUNNEL-ID>.json

# Ingress rules - how to route traffic
ingress:
  # Route api.illiniguide.com to local FastAPI backend
  - hostname: api.illiniguide.com
    service: http://localhost:8000
    originRequest:
      # Disable TLS verification for local backend
      noTLSVerify: true
      # Connection timeout
      connectTimeout: 30s
      # Keep-alive settings
      keepAliveConnections: 100
      keepAliveTimeout: 90s
  
  # Catch-all rule (required - must be last)
  - service: http_status:404
```

**Replace:**
- `<YOUR-TUNNEL-ID>` with your actual tunnel ID
- `/home/your-username/` with your actual home directory
- `api.illiniguide.com` with your desired subdomain

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Configure DNS

```bash
# Create DNS record
cloudflared tunnel route dns illiniguide-backend api.illiniguide.com
```

**What this does:**
- Creates a CNAME record in Cloudflare DNS
- Points `api.illiniguide.com` to your tunnel
- Format: `api.illiniguide.com → <TUNNEL-ID>.cfargotunnel.com`

**Verify in Cloudflare Dashboard:**
1. Go to your domain in Cloudflare
2. Click **DNS** tab
3. You should see a CNAME record for `api`

---

## Running the Tunnel

### Test Run (Foreground)

First, test the tunnel in foreground mode to ensure it works:

```bash
cloudflared tunnel run illiniguide-backend
```

**Expected output:**
```
INF Starting tunnel tunnelID=<YOUR-TUNNEL-ID>
INF Connection registered connIndex=0 location=ORD
INF Connection registered connIndex=1 location=ORD
INF Connection registered connIndex=2 location=ORD
INF Connection registered connIndex=3 location=ORD
```

**What this means:**
- ✅ 4 connections established (Cloudflare creates 4 redundant connections)
- ✅ `location=ORD` means Chicago data center (perfect for your VPS!)
- ✅ Tunnel is ready to receive traffic

**Test it:**
```bash
# In another terminal or from your local machine
curl https://api.illiniguide.com/api/v1/health
```

If your backend is running, you should get a response!

**Stop the test:** Press `Ctrl+C`

---

## Production Deployment

### Step 7: Install as System Service

```bash
# Install cloudflared as a system service
sudo cloudflared service install
```

**What this does:**
- Creates a systemd service
- Configures auto-start on boot
- Runs as background daemon

### Step 8: Start the Service

```bash
# Start the tunnel service
sudo systemctl start cloudflared

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

**Expected status:**
```
● cloudflared.service - cloudflared
   Loaded: loaded (/etc/systemd/system/cloudflared.service; enabled)
   Active: active (running) since ...
```

### Step 9: Verify Tunnel is Running

```bash
# Check tunnel status
cloudflared tunnel info illiniguide-backend

# View live logs
sudo journalctl -u cloudflared -f
```

---

## Testing

### 1. Test Tunnel Connectivity

```bash
# Test from your local machine
curl https://api.illiniguide.com

# Test with actual API endpoint
curl -X POST https://api.illiniguide.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello, test message"}'
```

### 2. Test from Frontend

Update your Cloudflare Pages environment variable:

```
VITE_BACKEND_URL=https://api.illiniguide.com/api/v1/chat
```

Then test from your frontend application.

### 3. Check Tunnel Metrics

```bash
# View tunnel info
cloudflared tunnel info illiniguide-backend

# Check connections
cloudflared tunnel list
```

---

## Advanced Configuration

### Multiple Services

If you want to route multiple subdomains:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Main API
  - hostname: api.illiniguide.com
    service: http://localhost:8000
  
  # Admin panel (if you have one)
  - hostname: admin.illiniguide.com
    service: http://localhost:3000
  
  # Metrics/monitoring
  - hostname: metrics.illiniguide.com
    service: http://localhost:9090
  
  # Catch-all
  - service: http_status:404
```

### Load Balancing

For high availability, you can run multiple tunnel instances:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<YOUR-TUNNEL-ID>.json

# Load balancer configuration
lb-pool: backend-pool

ingress:
  - hostname: api.illiniguide.com
    service: http://localhost:8000
    # Origin request settings
    originRequest:
      # Load balancing
      loadBalancer:
        strategy: random  # or 'least_outstanding_requests'
  
  - service: http_status:404
```

### Access Control

Add Cloudflare Access for authentication:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: api.illiniguide.com
    service: http://localhost:8000
    # Require Cloudflare Access authentication
    originRequest:
      access:
        required: true
        teamName: your-team-name
        audTag: your-aud-tag
  
  - service: http_status:404
```

---

## Monitoring & Maintenance

### View Logs

```bash
# Real-time logs
sudo journalctl -u cloudflared -f

# Last 100 lines
sudo journalctl -u cloudflared -n 100

# Logs from today
sudo journalctl -u cloudflared --since today

# Logs with specific priority (errors only)
sudo journalctl -u cloudflared -p err
```

### Restart Service

```bash
# Restart tunnel
sudo systemctl restart cloudflared

# Check status after restart
sudo systemctl status cloudflared
```

### Update cloudflared

```bash
# Stop service
sudo systemctl stop cloudflared

# Update (if installed via package manager)
sudo apt update && sudo apt upgrade cloudflared

# Or download latest manually
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Restart service
sudo systemctl start cloudflared
```

### Tunnel Health Check

```bash
# Check tunnel info
cloudflared tunnel info illiniguide-backend

# List all tunnels
cloudflared tunnel list

# Check specific tunnel details
cloudflared tunnel info <TUNNEL-ID>
```

---

## Troubleshooting

### Issue: Tunnel Won't Start

**Symptoms:**
```
Failed to start cloudflared.service
```

**Solutions:**

1. **Check configuration file syntax:**
   ```bash
   cloudflared tunnel ingress validate
   ```

2. **Check credentials file exists:**
   ```bash
   ls -la ~/.cloudflared/<TUNNEL-ID>.json
   ```

3. **Check logs for specific error:**
   ```bash
   sudo journalctl -u cloudflared -n 50
   ```

### Issue: Connection Errors

**Symptoms:**
```
ERR error="dial tcp 127.0.0.1:8000: connect: connection refused"
```

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:8000
   ```

2. **Check backend logs:**
   ```bash
   # If using PM2
   pm2 logs backend
   
   # If using systemd
   sudo journalctl -u backend -f
   ```

3. **Verify port number in config.yml matches backend:**
   ```bash
   cat ~/.cloudflared/config.yml | grep service
   ```

### Issue: DNS Not Resolving

**Symptoms:**
```
curl: (6) Could not resolve host: api.illiniguide.com
```

**Solutions:**

1. **Check DNS record in Cloudflare:**
   - Login to Cloudflare Dashboard
   - Go to DNS tab
   - Verify CNAME record exists

2. **Re-create DNS route:**
   ```bash
   cloudflared tunnel route dns illiniguide-backend api.illiniguide.com
   ```

3. **Wait for DNS propagation (usually < 5 minutes):**
   ```bash
   # Check DNS propagation
   nslookup api.illiniguide.com
   dig api.illiniguide.com
   ```

### Issue: 502 Bad Gateway

**Symptoms:**
Browser shows "502 Bad Gateway" error

**Solutions:**

1. **Backend not running:**
   ```bash
   # Check if backend is running
   ps aux | grep uvicorn  # or your backend process
   
   # Start backend
   cd /path/to/backend
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Wrong port in config:**
   - Verify `service: http://localhost:8000` matches your backend port

3. **Firewall blocking local connections:**
   ```bash
   # Allow local connections
   sudo ufw allow from 127.0.0.1
   ```

### Issue: Tunnel Disconnects Frequently

**Symptoms:**
Logs show repeated disconnections and reconnections

**Solutions:**

1. **Check VPS network stability:**
   ```bash
   ping -c 100 1.1.1.1
   ```

2. **Increase keepalive timeout in config.yml:**
   ```yaml
   originRequest:
     keepAliveTimeout: 180s
     keepAliveConnections: 100
   ```

3. **Check VPS resources:**
   ```bash
   # Check CPU and memory
   top
   
   # Check disk space
   df -h
   ```

---

## Security Best Practices

### 1. Protect Credentials File

```bash
# Set proper permissions
chmod 600 ~/.cloudflared/<TUNNEL-ID>.json
chmod 600 ~/.cloudflared/config.yml

# Verify
ls -la ~/.cloudflared/
```

### 2. Use Cloudflare Access

Add authentication layer for sensitive endpoints:

1. Go to Cloudflare Dashboard → Zero Trust → Access
2. Create Access Policy for `api.illiniguide.com`
3. Configure authentication methods (Google, GitHub, etc.)

### 3. Rate Limiting

Add rate limiting in Cloudflare:

1. Go to Security → WAF → Rate limiting rules
2. Create rule for `/api/*` endpoints
3. Set appropriate limits (e.g., 100 requests per minute)

### 4. Monitor Access Logs

```bash
# Enable detailed logging
sudo journalctl -u cloudflared -f --output=json-pretty
```

---

## Backup & Recovery

### Backup Tunnel Configuration

```bash
# Backup credentials
cp ~/.cloudflared/<TUNNEL-ID>.json ~/tunnel-backup.json

# Backup config
cp ~/.cloudflared/config.yml ~/tunnel-config-backup.yml

# Store securely (encrypted)
tar -czf tunnel-backup.tar.gz ~/tunnel-backup.json ~/tunnel-config-backup.yml
gpg -c tunnel-backup.tar.gz
```

### Restore Tunnel

```bash
# Restore credentials
cp ~/tunnel-backup.json ~/.cloudflared/<TUNNEL-ID>.json

# Restore config
cp ~/tunnel-config-backup.yml ~/.cloudflared/config.yml

# Restart service
sudo systemctl restart cloudflared
```

### Delete Tunnel (if needed)

```bash
# Stop service
sudo systemctl stop cloudflared

# Delete tunnel
cloudflared tunnel delete illiniguide-backend

# Remove DNS record
cloudflared tunnel route dns delete <TUNNEL-ID> api.illiniguide.com

# Remove credentials
rm ~/.cloudflared/<TUNNEL-ID>.json
```

---

## Quick Reference

### Common Commands

```bash
# Service management
sudo systemctl start cloudflared
sudo systemctl stop cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared

# Tunnel management
cloudflared tunnel list
cloudflared tunnel info <NAME>
cloudflared tunnel delete <NAME>

# DNS routing
cloudflared tunnel route dns <NAME> <HOSTNAME>
cloudflared tunnel route ip delete <TUNNEL-ID>/<CIDR>

# Logs
sudo journalctl -u cloudflared -f
sudo journalctl -u cloudflared -n 100
sudo journalctl -u cloudflared --since "1 hour ago"

# Testing
cloudflared tunnel ingress validate
cloudflared tunnel ingress rule https://api.illiniguide.com
```

### Configuration File Locations

```
~/.cloudflared/cert.pem          # Authentication certificate
~/.cloudflared/config.yml        # Tunnel configuration
~/.cloudflared/<TUNNEL-ID>.json  # Tunnel credentials
/etc/systemd/system/cloudflared.service  # Systemd service file
```

---

## Next Steps

After successful tunnel setup:

1. ✅ Update `VITE_BACKEND_URL` in Cloudflare Pages
2. ✅ Test end-to-end flow from frontend
3. ✅ Set up monitoring and alerts
4. ✅ Configure backup strategy
5. ✅ Document your specific tunnel ID and domain

---

## Additional Resources

- **Official Documentation:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Tunnel Guide:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/
- **Troubleshooting:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/
- **GitHub:** https://github.com/cloudflare/cloudflared

# Backport - Buyer Setup Guide

## After Purchase — Step-by-Step Setup

Congratulations on acquiring Backport! Follow this guide to get everything running under your ownership.

---

## Step 1: Code Ownership Transfer (15 min)

### GitHub Repository
1. Request repository transfer from seller
2. Accept the transfer on your GitHub account
3. Update repository settings:
   - Change visibility if needed (Public/Private)
   - Update description and topics
   - Review and update branch protection rules

### Code Review
1. Clone the repository to your local machine
2. Review the codebase structure
3. Check for any seller-specific configurations
4. Update copyright notices if desired

---

## Step 2: Domain Transfer (1-3 days)

### For backport.in (IN Registry)
1. Seller initiates transfer at current registrar
2. You'll receive transfer authorization code
3. Accept transfer at your registrar
4. Update DNS records to point to your servers

### For backport.io (Tucows/ porkbun)
1. Same process as above
2. .io transfers may take 5-7 days to complete

### DNS Configuration
After transfer, update DNS:
```
; Frontend
backport.in          A       your-server-ip
www.backport.in      CNAME   backport.in

; Backend API
api.backport.in      A       your-server-ip
```

---

## Step 3: Infrastructure Setup (30 min)

### Option A: Docker Deployment (Recommended)

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone the repo
git clone https://github.com/your-username/Backport-io.git
cd Backport-io

# 4. Configure environment
cp .env.example .env
nano .env
# Set these values:
# - DATABASE_URL=postgresql://user:pass@localhost:5432/backport
# - JWT_SECRET=<generate-a-strong-random-string>
# - CORS_ORIGINS=https://backport.in
# - NEXT_PUBLIC_API_URL=https://api.backport.in

# 5. Start services
docker compose up -d --build

# 6. Verify
curl http://localhost:8000/health
```

### Option B: Vercel + Railway
1. Fork repo to your GitHub
2. Connect frontend to Vercel
3. Connect backend to Railway
4. Set environment variables in both platforms

---

## Step 4: SSL Certificate (10 min)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d backport.in -d api.backport.in

# Auto-renewal is handled by Certbot timer
sudo systemctl status certbot.timer
```

---

## Step 5: Email & Communication Setup (20 min)

1. **Professional Email** (recommended)
   - Set up sales@backport.in with Google Workspace or Zoho Mail
   - Update email in landing page footer
   - Configure email forwarding if needed

2. **Social Media Accounts**
   - Request transfer of X/Twitter account
   - Update profile links and bio

3. **Monitoring**
   - Set up UptimeRobot (free) for availability monitoring
   - Configure alerts to your email/Slack

---

## Step 6: Payment Integration (30 min)

Backport's pricing model is ready to go. To accept payments:

### Option A: Stripe
1. Create a Stripe account
2. Add Stripe API keys to `.env`
3. Implement checkout flow (if not already built)
4. Test with Stripe test mode

### Option B: LemonSqueezy (Easier)
1. Create account at lemonsqueezy.com
2. Create products matching the pricing tiers
3. Use LemonSqueezy checkout links

### Option C: Razorpay (India)
1. Create Razorpay account
2. Set up payment routes for Indian customers
3. Webhook integration for payment confirmation

---

## Step 7: Testing & Verification (30 min)

Before going live, test everything:

```bash
# 1. Health check
curl https://api.backport.in/health

# 2. User registration
curl -X POST https://api.backport.in/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# 3. WAF test (should be blocked)
curl https://api.backport.in/proxy/test?id=1' OR '1'='1

# 4. Load test (optional)
# Use hey or ab to simulate traffic
hey -n 1000 -c 50 https://api.backport.in/proxy/your-endpoint
```

### Frontend Checklist
- [ ] Landing page loads correctly
- [ ] Signup/login flow works
- [ ] Dashboard renders with charts
- [ ] API key creation works
- [ ] WAF demo on landing page works
- [ ] Mobile responsive on phone
- [ ] SSL certificate valid (green padlock)

---

## Step 8: Launch & Marketing

### Immediate Actions
1. Post on X/Twitter about the acquisition
2. Update Product Hunt listing (or create new one)
3. Share on Reddit (r/selfhosted, r/webdev, r/SaaS)
4. Write a Dev.to article about Backport

### Ongoing Marketing
1. Weekly social media posts
2. SEO optimization for "API gateway", "WAF", "API security"
3. Content marketing (blog posts about API security)
4. Cold outreach to potential customers

### Revenue Targets
| Timeline | Target MRR |
|----------|-----------|
| Month 1-2 | $50-100 |
| Month 3-4 | $200-500 |
| Month 5-6 | $500-1,000 |

---

## Support Contacts

If you need help during setup:
- Email: sales@backport.in
- Check the `/docs` folder for detailed API and deployment documentation
- Review GitHub Issues for any known issues

---

## Important Notes

1. **Database Migration**: The current setup uses SQLite. For production with multiple users, migrate to PostgreSQL
2. **Environment Secrets**: Never commit `.env` files. Always use environment variables in production
3. **Backups**: Set up automated database backups from day one
4. **Monitoring**: Use a monitoring tool (UptimeRobot, BetterUptime) for availability alerts

# Cloudinary Setup Guide for EduShare

Your application has been configured to use **Cloudinary** for cloud storage instead of local file storage.

## ✅ What's Changed

- ✓ Packages installed: `cloudinary` and `multer-storage-cloudinary`
- ✓ Upload route updated to use Cloudinary
- ✓ Profile photo upload configured with auto-optimization
- ✓ Resources stored in `edushare/resources` folder
- ✓ Profile photos stored in `edushare/profiles` folder

## 🚀 Getting Started

### Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **Sign Up Free**
3. Complete registration (email verification required)
4. You'll get a free account with:
   - 25 GB storage
   - 25M transformation credits/month
   - Unlimited bandwidth

### Step 2: Get Your Credentials

1. **Log in** to your Cloudinary dashboard
2. Go to **Settings** (gear icon in top right)
3. Click **API Keys** tab
4. Copy these three credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 3: Update Your `.env` File

Replace the placeholders in `server/.env`:

```env
PORT=5000
JWT_SECRET=change_this_secret
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://admin:123@cluster0.tmhgoqq.mongodb.net/?appName=Cluster0

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name_here
CLOUDINARY_API_KEY=your_actual_api_key_here
CLOUDINARY_API_SECRET=your_actual_api_secret_here
```

Example:
```env
CLOUDINARY_CLOUD_NAME=djksf9234
CLOUDINARY_API_KEY=987654321
CLOUDINARY_API_SECRET=abc123xyz789
```

### Step 4: Restart Your Server

```bash
cd server
npm run dev
```

## 📁 Folder Structure

Your uploads will be organized in Cloudinary:

```
edushare/
├── resources/
│   └── (all resource files - PDFs, docs, images, etc.)
└── profiles/
    └── (user profile photos - auto-optimized)
```

## 🎯 Supported File Types

**Resources (up to 20MB):**
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Images: JPG, JPEG, PNG, GIF
- Archives: ZIP, RAR

**Profile Photos (up to 5MB):**
- JPG, JPEG, PNG, GIF
- Auto-optimized to 200x200px
- Auto-formatted for web

## 💰 Pricing

Cloudinary Free Plan includes:
- 25 GB storage
- 25M transformations/month
- Unlimited bandwidth
- Perfect for development and small production apps

Paid plans start at $99/month for higher limits.

## 🔒 Security Notes

⚠️ **Never commit your `.env` file** to git. It contains sensitive credentials.

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

## ✨ Features Enabled

✅ Automatic image optimization  
✅ CDN delivery (fast downloads worldwide)  
✅ Secure cloud storage  
✅ Version control for all uploads  
✅ Auto-scaling & backups  

## 🆘 Troubleshooting

**"Invalid credentials"** error?
- Double-check your credentials in `.env`
- Make sure you copied exactly (no extra spaces)
- Restart the server after updating `.env`

**Files uploading but CDN links broken?**
- Verify `CLOUDINARY_CLOUD_NAME` is correct
- Check folder permissions in Cloudinary dashboard

**Need help?**
- Cloudinary Docs: https://cloudinary.com/documentation
- Support: support@cloudinary.com

---

**That's it!** Your EduShare app now uses cloud storage. All resource uploads and profile photos are automatically stored on Cloudinary's secure servers.

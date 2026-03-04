# 🚀 START HERE - Complete Deployment Guide

## ⚠️ CRITICAL SECURITY NOTICE

**Your AWS credentials were exposed in chat and are now compromised.**

### IMMEDIATE ACTION REQUIRED:

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → Your username → "Security credentials"
3. Find access key `AKIA4MI2JL7VIWKURR3N`
4. Click "Actions" → "Deactivate" or "Delete"
5. Create new credentials (you'll use these in Step 1 below)

---

## 📋 What You're Deploying

A complete Employee Ideas Management System with:
- **Frontend**: React app on S3
- **Backend**: 2 Lambda functions (User Service, Ideas Service)
- **Database**: 2 DynamoDB tables (Users, Ideas)
- **API**: API Gateway with CORS enabled
- **Region**: us-east-2 (Ohio)

**Estimated deployment time**: 5 minutes  
**Estimated cost**: Free tier eligible, ~$5-10/month after

---

## 🎯 Quick Deploy (3 Commands)

### For Linux/Mac/Git Bash:

```bash
# 1. Configure AWS credentials securely
./scripts/setup-aws-profile.sh

# 2. Deploy everything
./scripts/deploy-all.sh

# 3. Create admin user
./scripts/create-admin-user.sh
```

### For Windows CMD:

```cmd
REM 1. Configure AWS credentials securely
scripts\setup-aws-profile.bat

REM 2. Deploy everything (use Git Bash for this)
bash scripts/deploy-all.sh

REM 3. Create admin user (use Git Bash for this)
bash scripts/create-admin-user.sh
```

---

## 📖 Detailed Step-by-Step Guide

### Prerequisites

✅ AWS Account  
✅ AWS CLI installed ([Download](https://aws.amazon.com/cli/))  
✅ Node.js 18+ installed ([Download](https://nodejs.org/))  
✅ Git Bash (Windows) or Terminal (Mac/Linux)

### Step 1: Configure AWS Credentials (2 minutes)

**Linux/Mac/Git Bash:**
```bash
./scripts/setup-aws-profile.sh
```

**Windows CMD:**
```cmd
scripts\setup-aws-profile.bat
```

When prompted, enter:
- **AWS Access Key ID**: Your NEW access key (not the exposed one)
- **AWS Secret Access Key**: Your NEW secret key
- **Default region name**: `us-east-2`
- **Default output format**: `json`

Your credentials will be stored securely in `~/.aws/credentials`.

### Step 2: Deploy Everything (3 minutes)

```bash
./scripts/deploy-all.sh
```

This will:
1. ✅ Create DynamoDB tables (Users, Ideas)
2. ✅ Deploy Lambda functions (User Service, Ideas Service)
3. ✅ Configure API Gateway with CORS
4. ✅ Deploy React frontend to S3

**Wait for completion** - takes about 2-3 minutes.

At the end, you'll see:
```
Website URL: http://production-employee-ideas-frontend-123456789.s3-website.us-east-2.amazonaws.com
API Gateway URL: https://abc123.execute-api.us-east-2.amazonaws.com/production
```

**Save these URLs!**

### Step 3: Create Admin User (30 seconds)

```bash
./scripts/create-admin-user.sh
```

Enter:
- **Username**: `admin` (or your choice)
- **Password**: `Admin123!` (or your choice - remember this!)
- **Email**: `admin@example.com` (or your email)

### Step 4: Access Your Application

1. Open the **Website URL** in your browser
2. Log in with your admin credentials
3. You're in! 🎉

---

## 🧪 Test Your Deployment

### Create Test Users

1. Log in as admin
2. Go to "User Management"
3. Create users with different roles:
   - Employee: `employee1` / `Employee123!`
   - Reviewer: `reviewer1` / `Reviewer123!`
   - Implementer: `implementer1` / `Implementer123!`

### Test the Workflow

1. **As Employee**: Submit an idea
2. **As Reviewer**: Review and assign the idea
3. **As Implementer**: Update status and add comments
4. **As Admin**: View all ideas and users

---

## 📊 What Was Deployed?

### DynamoDB Tables (us-east-2)
- `production-Users` - User accounts
- `production-Ideas` - Ideas and comments

### Lambda Functions (us-east-2)
- `production-UserService` - Authentication, user management
- `production-IdeasService` - Idea CRUD, assignments, comments

### API Gateway (us-east-2)
- HTTP API with CORS enabled (`*`)
- Endpoints: `/auth/*`, `/users/*`, `/ideas/*`

### S3 Bucket (us-east-2)
- `production-employee-ideas-frontend-{AccountId}` - Static website

---

## 🛠️ Useful Commands

### Get Deployment Information
```bash
./scripts/get-deployment-info.sh
```

### View Lambda Logs
```bash
# User Service
aws logs tail /aws/lambda/production-UserService --follow --profile employee-ideas --region us-east-2

# Ideas Service
aws logs tail /aws/lambda/production-IdeasService --follow --profile employee-ideas --region us-east-2
```

### Redeploy Components
```bash
# Redeploy frontend only
./scripts/deploy-frontend.sh

# Redeploy backend only
./scripts/deploy-backend.sh

# Redeploy infrastructure only
./scripts/deploy-infrastructure.sh
```

### Delete Everything
```bash
./scripts/cleanup.sh
```
**WARNING**: This permanently deletes all data!

---

## 🐛 Troubleshooting

### "Profile not found" error
Run `./scripts/setup-aws-profile.sh` to configure credentials.

### Can't access website
- Check that S3 bucket policy allows public access
- Verify API Gateway URL is correct in frontend build
- Check browser console for errors

### Login not working
- Verify admin user was created: Check DynamoDB console
- Check CloudWatch logs for Lambda errors
- Verify API Gateway CORS is enabled

### Lambda deployment fails
```bash
# Rebuild Lambda functions
cd backend/user-service && npm install && npm run build
cd backend/ideas-service && npm install && npm run build
```

### CORS errors
- Verify API Gateway CORS configuration in CloudFormation
- Check that `Access-Control-Allow-Origin: *` is set
- Clear browser cache

---

## 💰 Cost Estimate

### With AWS Free Tier (First 12 Months)
- **DynamoDB**: Free (25 GB, 25 WCU, 25 RCU)
- **Lambda**: Free (1M requests/month)
- **API Gateway**: Free (1M requests/month)
- **S3**: Free (5 GB storage)
- **Total**: $0/month

### After Free Tier (Light Usage)
- **DynamoDB**: $1-2/month
- **Lambda**: $1-2/month
- **API Gateway**: $1-2/month
- **S3**: $0.50/month
- **Total**: ~$5-10/month

---

## 📚 Documentation

- **This Guide**: [START-HERE.md](START-HERE.md) ← You are here
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Full Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Deployment Summary**: [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)
- **Deployment Checklist**: [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- **Project README**: [README.md](README.md)

---

## 🔐 Security Best Practices

✅ **DO**:
- Store credentials in `~/.aws/credentials`
- Use AWS CLI profiles
- Rotate credentials regularly
- Enable CloudWatch logging
- Use HTTPS in production (CloudFront)

❌ **DON'T**:
- Commit credentials to git
- Share credentials in chat/email
- Use root account credentials
- Disable CloudWatch logging
- Use HTTP in production

---

## 🎉 Success!

If you've completed all steps, your Employee Ideas Management System is now live on AWS!

**Your URLs**:
- Website: _________________________________
- API Gateway: _________________________________

**Your Admin Credentials**:
- Username: _________________________________
- Password: _________________________________ (store securely!)

---

## 🆘 Need Help?

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting
2. Review CloudWatch logs for errors
3. Verify all prerequisites are met
4. Check AWS Console for resource status

---

## 🚀 Next Steps

1. **Customize**: Update branding, colors, logos
2. **Add Users**: Create employee, reviewer, and implementer accounts
3. **Test Workflow**: Submit and process ideas end-to-end
4. **Monitor**: Set up CloudWatch alarms
5. **Secure**: Enable HTTPS with CloudFront (production)
6. **Scale**: Configure auto-scaling if needed

---

## 📝 Quick Reference

```bash
# Deploy everything
./scripts/deploy-all.sh

# Get info
./scripts/get-deployment-info.sh

# View logs
aws logs tail /aws/lambda/production-UserService --follow --profile employee-ideas --region us-east-2

# Cleanup
./scripts/cleanup.sh
```

---

**Ready to deploy? Start with Step 1 above! 🚀**

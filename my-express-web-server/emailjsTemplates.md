# EmailJS Templates for Request Status Updates

## Template: Request Status Update (Approval/Rejection)

**Template ID:** `template_request_status_update`
**Subject:** Your {{request_type}} Request - {{status}}

**HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Request Status Update</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #2c3e50; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">
                📋 Request Status Update
            </h1>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 20px;">
            <!-- Status Banner -->
            <div style="background-color: {{status === 'Approved' ? '#d4edda' : '#f8d7da'}}; border: 1px solid {{status === 'Approved' ? '#c3e6cb' : '#f5c6cb'}}; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <h2 style="color: {{status === 'Approved' ? '#155724' : '#721c24'}}; margin: 0; font-size: 24px; font-weight: 600;">
                    {{status === 'Approved' ? '✅ Request Approved' : '❌ Request Rejected'}}
                </h2>
                <p style="color: {{status === 'Approved' ? '#155724' : '#721c24'}}; margin: 10px 0 0 0; font-size: 16px;">
                    Your request has been {{status === 'Approved' ? 'approved' : 'rejected'}} by an administrator.
                </p>
            </div>
            
            <!-- Request Details -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                    Request Information
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 12px 0; font-weight: 600; width: 150px; color: #2c3e50;">Request Type:</td>
                        <td style="padding: 12px 0; color: #34495e;">{{request_type}}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; font-weight: 600; color: #2c3e50;">Requester Name:</td>
                        <td style="padding: 12px 0; color: #34495e;">{{requester_name}}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; font-weight: 600; color: #2c3e50;">Current Status:</td>
                        <td style="padding: 12px 0; color: #27ae60; font-weight: 600; font-size: 18px;">{{status}}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; font-weight: 600; color: #2c3e50;">Review Date:</td>
                        <td style="padding: 12px 0; color: #34495e;">{{review_date}}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Inventory Details (for transfer requests) -->
            {{#if inventory_details}}
            <div style="background-color: #e8f4fd; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                    📦 Inventory Details
                </h3>
                <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db;">
                    <p style="margin: 0; color: #2c3e50; font-size: 16px;">{{inventory_details}}</p>
                </div>
            </div>
            {{/if}}
            
            <!-- Admin Notes -->
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #856404; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
                    📝 Administrator Notes
                </h3>
                <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-size: 16px; line-height: 1.8;">{{admin_notes}}</p>
                </div>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #d1ecf1; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #0c5460; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">
                    🎯 Next Steps
                </h3>
                {{#if status === 'Approved'}}
                <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #17a2b8;">
                    <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.8;">
                        <strong>Congratulations!</strong> Your request has been approved. Please log into the AREC GIS system to view the complete details and take any necessary actions.
                    </p>
                    {{#if request_type === 'Transfer Request'}}
                    <p style="margin: 15px 0 0 0; color: #0c5460; font-size: 16px; line-height: 1.8;">
                        <strong>Transfer Complete:</strong> The inventory ownership has been transferred to your account. You can now manage and view the transferred inventory in your dashboard.
                    </p>
                    {{/if}}
                    {{#if request_type === 'Bulk Transfer Request'}}
                    <p style="margin: 15px 0 0 0; color: #0c5460; font-size: 16px; line-height: 1.8;">
                        <strong>Bulk Transfer Complete:</strong> All requested inventories have been transferred to your account. You can now manage and view all transferred inventories in your dashboard.
                    </p>
                    {{/if}}
                    {{#if request_type === 'Account Deletion Request'}}
                    <p style="margin: 15px 0 0 0; color: #0c5460; font-size: 16px; line-height: 1.8;">
                        <strong>Account Deactivated:</strong> Your account has been deactivated as requested. If you need to reactivate your account, please contact the system administrator.
                    </p>
                    {{/if}}
                </div>
                {{else}}
                <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #17a2b8;">
                    <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.8;">
                        <strong>Request Rejected:</strong> Your request has been rejected. Please review the administrator notes above for more details about the rejection.
                    </p>
                    <p style="margin: 15px 0 0 0; color: #0c5460; font-size: 16px; line-height: 1.8;">
                        If you have questions about the rejection or would like to submit a new request, please contact the system administrator or review the requirements and try again.
                    </p>
                </div>
                {{/if}}
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #ecf0f1; padding: 30px 20px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
                    <strong>Need Help?</strong> Contact the AREC GIS System Administrator
                </p>
            </div>
            <div style="border-top: 1px solid #bdc3c7; padding-top: 20px;">
                <p style="margin: 0; color: #7f8c8d; font-size: 12px;">
                    This is an automated notification from the AREC GIS System.
                </p>
                <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 12px;">
                    Please do not reply to this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
```

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Requester's email address | `user@example.com` |
| `{{request_type}}` | Type of request | `Transfer Request`, `Bulk Transfer Request`, `Account Deletion Request` |
| `{{requester_name}}` | Name of the requester | `John Doe` |
| `{{status}}` | Request status | `Approved`, `Rejected` |
| `{{admin_notes}}` | Notes from the administrator | `Request approved after document review` |
| `{{review_date}}` | Date and time of review | `January 15, 2025 at 2:30 PM` |
| `{{inventory_details}}` | Details about inventories (for transfer requests) | `ABC Company - Solar Energy (50 kW)` |

## Setup Instructions

### 1. **Create EmailJS Template**
1. Go to your EmailJS dashboard
2. Create a new email template
3. Copy the HTML template above
4. Set the subject line to: `Your {{request_type}} Request - {{status}}`
5. Save the template and note the Template ID

### 2. **Update Environment Variables**
Add these to your backend `.env` file:
```env
EMAILJS_SERVICE_ID=your_service_id_here
EMAILJS_TEMPLATE_ID=your_template_id_here
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_USER_ID=your_user_id_here
```

### 3. **Test the Integration**
1. Submit a test request
2. Approve or reject the request as an admin
3. Check if the email is sent to the requester
4. Verify all template variables are populated correctly

## Features

- ✅ **Responsive Design**: Works on all devices
- ✅ **Status-Specific Content**: Different content for approved vs rejected requests
- ✅ **Professional Appearance**: Clean, branded design
- ✅ **Clear Information**: All request details clearly displayed
- ✅ **Action Items**: Clear next steps for users
- ✅ **Error Handling**: Graceful fallback if email fails

## Notes

- The template automatically adapts content based on request status
- Inventory details are only shown when relevant
- Email notifications are sent automatically when requests are approved/rejected
- If email sending fails, the request approval/rejection still proceeds
- All template variables are automatically populated by the backend


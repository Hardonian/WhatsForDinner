// @ts-nocheck
import { Job } from 'bullmq';
import { logger } from '../observability/index';
import { usersRepo, mealPlansRepo, healthMetricsRepo } from '../db/index';
// Email sending via SendGrid (optional dependency)
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const sgMail = await import('@sendgrid/mail');
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not set');
    }
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.default.send({
      to,
      from: process.env.SENDER_EMAIL || 'no-reply@nomad.app',
      subject,
      html,
    });
  } catch (error) {
    // Fallback: just log if SendGrid not available
    logger.warn({ error }, 'SendGrid not available, email not sent');
    throw error;
  }
}

interface DigestJobData {
  userId: string;
  weekStart: string;
}

export async function digestProcessor(job: Job<DigestJobData>) {
  const { userId, weekStart } = job.data;

  logger.info({ userId, weekStart, jobId: job.id }, 'Starting weekly digest generation');

  try {
    const user = await usersRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Gather data for the week
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const [plans, metrics] = await Promise.all([
      mealPlansRepo.findByUser(userId, { limit: 7 }),
      healthMetricsRepo.findByUser(userId, {
        from: weekStartDate,
        to: weekEndDate,
      }),
    ]);

    // Calculate progress
    const totalMeals = plans.data.length;
    const totalCalories = metrics
      .filter((m) => m.kind === 'calories')
      .reduce((sum, m) => sum + Number(m.value), 0);

    // Generate email content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .stat { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Weekly Nomad Digest</h1>
            </div>
            <div class="content">
              <h2>Your Progress This Week</h2>
              <div class="stat">
                <strong>Meals Planned:</strong> ${totalMeals}
              </div>
              <div class="stat">
                <strong>Total Calories Tracked:</strong> ${Math.round(totalCalories)}
              </div>
              <p>Keep up the great work! ??</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    if (process.env.SENDGRID_API_KEY) {
      await sendEmail(user.email, 'Your Weekly Nomad Digest', html);
      logger.info({ userId }, 'Weekly digest email sent');
    } else {
      logger.warn({ userId }, 'SendGrid not configured, skipping email');
    }

    return { success: true, meals: totalMeals, calories: totalCalories };
  } catch (error) {
    logger.error({ userId, error: error instanceof Error ? error.message : String(error) }, 'Weekly digest generation failed');
    throw error;
  }
}

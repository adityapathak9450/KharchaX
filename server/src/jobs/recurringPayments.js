import RecurringPayment from '../models/RecurringPayment.model.js'
import Transaction from '../models/Transaction.model.js'
import Wallet from '../models/Wallet.model.js'
import { emitRecurringDue } from '../sockets/socketEmitter.js'

// Helper: calculate next due date based on frequency
function calculateNextDueDate(currentDate, frequency) {
  const next = new Date(currentDate)
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
    default:
      throw new Error(`Invalid frequency: ${frequency}`)
  }
  return next
}

// Process recurring payments that are due
export async function processRecurringPayments() {
  console.log('[Cron] Processing recurring payments...')
  
  const now = new Date()
  const startOfDay = new Date(now.setHours(0, 0, 0, 0))
  const endOfDay = new Date(now.setHours(23, 59, 59, 999))

  try {
    // Find payments due today
    const duePayments = await RecurringPayment.find({
      isActive: true,
      nextDueDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('wallet')
      .populate('category')

    console.log(`[Cron] Found ${duePayments.length} payments due today`)

    for (const payment of duePayments) {
      try {
        // Create transaction
        const transaction = await Transaction.create({
          userId: payment.userId,
          wallet: payment.wallet._id,
          category: payment.category._id,
          amount: payment.amount,
          type: payment.type,
          description: `${payment.name} (Auto-recurring)`,
          date: new Date()
        })

        // Update wallet balance
        const wallet = await Wallet.findById(payment.wallet._id)
        if (wallet) {
          if (payment.type === 'income') {
            wallet.balance += payment.amount
          } else {
            wallet.balance -= payment.amount
          }
          await wallet.save()
        }

        // Update recurring payment
        payment.lastProcessed = new Date()
        payment.nextDueDate = calculateNextDueDate(new Date(), payment.frequency)
        await payment.save()

        // Emit socket event for real-time notification
        emitRecurringDue(payment.userId.toString(), {
          paymentId: payment._id,
          name: payment.name,
          amount: payment.amount,
          type: payment.type,
          nextDueDate: payment.nextDueDate
        })

        console.log(`[Cron] Processed payment: ${payment.name} for user ${payment.userId}`)
      } catch (error) {
        console.error(`[Cron] Error processing payment ${payment._id}:`, error.message)
      }
    }

    console.log(`[Cron] Completed processing ${duePayments.length} recurring payments`)
  } catch (error) {
    console.error('[Cron] Error in recurring payments job:', error)
  }
}

// Check for payments due soon and send reminders
export async function checkDueSoonReminders() {
  console.log('[Cron] Checking for due soon reminders...')
  
  const now = new Date()
  
  try {
    const dueSoonPayments = await RecurringPayment.find({
      isActive: true,
      nextDueDate: { $gte: now }
    }).populate('category')
      .populate('wallet')

    // Filter by isDueSoon virtual
    const filtered = dueSoonPayments.filter(rp => rp.isDueSoon)

    console.log(`[Cron] Found ${filtered.length} payments due soon`)

    for (const payment of filtered) {
      try {
        // Emit socket event for reminder
        emitRecurringDue(payment.userId.toString(), {
          paymentId: payment._id,
          name: payment.name,
          amount: payment.amount,
          type: payment.type,
          nextDueDate: payment.nextDueDate,
          reminder: true
        })

        console.log(`[Cron] Sent reminder for: ${payment.name} for user ${payment.userId}`)
      } catch (error) {
        console.error(`[Cron] Error sending reminder for payment ${payment._id}:`, error.message)
      }
    }

    console.log(`[Cron] Completed due soon reminders`)
  } catch (error) {
    console.error('[Cron] Error in due soon reminders job:', error)
  }
}

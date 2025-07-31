import RepairTicket from '../models/RepairTicket.js';
import WorkOrder from '../models/WorkOrder.js';

/**
 * A reusable service to create a new repair ticket and its associated work order.
 * @param {object} ticketData - The data for the new ticket.
 * @returns {Promise<Document>} The saved Mongoose document for the new ticket.
 */
export const createTicketAndWorkOrder = async (ticketData) => {
    const { kaplanUnitNo, issueDescription, reason, priority, ticketStatus, attachments } = ticketData;

    // --- Part A: Create the Repair Ticket ---
    const today = new Date();
    const datePart = today.toISOString().split('T')[0].replace(/-/g, '');
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const todayCount = await RepairTicket.countDocuments({ createdAt: { $gte: startOfDay } });
    const countPart = (todayCount + 1).toString().padStart(4, '0');
    const kaplanShort = kaplanUnitNo.slice(-4).toUpperCase().padStart(4, 'X');
    const ticketNumber = `TCKT-${datePart}-${kaplanShort}-${countPart}`;

    const highestPriorityTicket = await RepairTicket.findOne().sort({ priorityRank: -1 });
    const nextPriorityRank = highestPriorityTicket ? highestPriorityTicket.priorityRank + 1 : 1;

    const newTicket = new RepairTicket({
        ticketNumber,
        priorityRank: nextPriorityRank,
        kaplanUnitNo,
        issueDescription,
        ticketStatus: ticketStatus || 'Under Diagnosis',
        reason,
        priority,
        attachments: attachments || [],
        date: new Date()
    });
    const savedTicket = await newTicket.save();

    // --- Part B: Create the corresponding Work Order ---
    let workOrderIdToUse;
    const existingWorkOrder = await WorkOrder.findOne({ kaplanUnitNo: savedTicket.kaplanUnitNo });

    if (existingWorkOrder && existingWorkOrder.workOrderId) {
        workOrderIdToUse = existingWorkOrder.workOrderId;
    } else {
        const highestWorkOrder = await WorkOrder.findOne().sort({ workOrderId: -1 });
        workOrderIdToUse = highestWorkOrder ? (highestWorkOrder.workOrderId || 0) + 1 : 1001;
    }

    const highestRank = await WorkOrder.findOne().sort({ priorityRank: -1 });
    const nextWorkOrderRank = highestRank ? highestRank.priorityRank + 1 : 1;

    const newWorkOrder = new WorkOrder({
        workOrderId: workOrderIdToUse,
        kaplanUnitNo: savedTicket.kaplanUnitNo,
        description: savedTicket.issueDescription,
        priority: savedTicket.priority,
        priorityRank: nextWorkOrderRank,
        ticketIds: [savedTicket._id]
    });
    await newWorkOrder.save();

    return savedTicket;
};

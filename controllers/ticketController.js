// controllers/ticketController.js

import Ticket from '../models/ticketModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import { mintTicket, markAsUsed } from '../services/blockchainService.js';
import { sendPurchaseConfirmationEmail } from '../services/notificationService.js'; // <-- 1. IMPORT THE FUNCTION

// @desc    Purchase a ticket for an event
// @route   POST /api/tickets/purchase
// @access  Private
export const purchaseTicket = async (req, res) => {
  const { eventId } = req.body;
  const attendeeId = req.user._id; // From our 'protect' middleware

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.ticketsSold >= event.capacity) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    // --- In a real app, payment gateway logic (Stripe/UPI) would go here ---
    // For now, we assume payment is successful.

    // For demonstration, we'll use a hardcoded wallet address.
    // In a real app, each user would have their own wallet address stored in their profile.
    const attendeeWalletAddress = '0x639958B29d0c7F3bA1Ccc1aeaBAd1e60e783b5F8'; // Using a Ganache account for now

    // 1. Call the blockchain service to mint the NFT
    const tokenId = await mintTicket(attendeeWalletAddress);

    // 2. Create the ticket record in our database
    const ticket = await Ticket.create({
      event: eventId,
      attendee: attendeeId,
      purchasePrice: event.ticketPrice,
      nftTokenId: tokenId,
    });

    // 3. Update the event's ticketsSold count
    event.ticketsSold += 1;
    await event.save();

    // 4. Send the confirmation email
    sendPurchaseConfirmationEmail(req.user, ticket, event); // <-- 2. CALL THE FUNCTION

    res.status(201).json({
      message: 'Ticket purchased and minted successfully!',
      ticket,
    });

  } catch (error) {
    console.error('Ticket purchase error:', error);
    res.status(500).json({ message: 'Server error during ticket purchase.' });
  }
};


// @desc    Validate a ticket via NFC scan
// @route   POST /api/tickets/validate
// @access  Private/Organizer
export const validateTicket = async (req, res) => {
  const { platformUserId, eventId } = req.body;

  try {
    // 1. Find the user by their permanent ID
    const user = await User.findOne({ platformUserId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid User ID. User not found.' });
    }

    // 2. Find the corresponding ticket for that user and event
    const ticket = await Ticket.findOne({ attendee: user._id, event: eventId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found for this user and event.' });
    }

    // 3. Check if the ticket has already been used in our database
    if (ticket.isCheckedIn) {
      return res.status(400).json({ success: false, message: 'This ticket has already been checked in.' });
    }

    // 4. Mark the ticket as used on the blockchain for ultimate security
    await markAsUsed(ticket.nftTokenId);

    // 5. Update the ticket status in our database
    ticket.isCheckedIn = true;
    await ticket.save();

    res.json({ success: true, message: 'Check-in successful!', user: { name: user.name } });

  } catch (error) {
    console.error('Validation Error:', error);
    // Check for a specific error from the blockchain
    if (error.message.includes('Ticket has already been used')) {
        return res.status(400).json({ success: false, message: 'Blockchain confirmation: Ticket already used.' });
    }
    res.status(500).json({ success: false, message: 'Server error during validation.' });
  }
};

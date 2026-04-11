const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/services', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM airport_services WHERE is_active = true ORDER BY price ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const {
      serviceId,
      flightNumber,
      airportName,
      pickupAddress,
      dropoffAddress,
      bookingDate,
      bookingTime,
      passengerCount,
      luggageCount,
      specialRequests
    } = req.body;

    const service = await pool.query(
      'SELECT id, price, max_passengers, max_luggage FROM airport_services WHERE id = $1 AND is_active = true',
      [serviceId]
    );

    if (!service.rows.length) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const selected = service.rows[0];
    const passengers = Number(passengerCount || 1);
    const luggage = Number(luggageCount || 0);

    if (passengers < 1 || passengers > selected.max_passengers) {
      return res.status(400).json({ message: 'Passenger count exceeds service limit' });
    }

    if (luggage < 0 || luggage > selected.max_luggage) {
      return res.status(400).json({ message: 'Luggage count exceeds service limit' });
    }

    const result = await pool.query(
      `INSERT INTO airport_bookings
       (user_id, service_id, flight_number, airport_name, pickup_address, dropoff_address, booking_date, booking_time, passenger_count, luggage_count, special_requests, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.id,
        serviceId,
        flightNumber || null,
        airportName,
        pickupAddress || null,
        dropoffAddress || null,
        bookingDate,
        bookingTime,
        passengers,
        luggage,
        specialRequests || null,
        selected.price
      ]
    );

    res.status(201).json({ message: 'Booked successfully', booking: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/bookings/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ab.*, aps.name AS service_name, aps.vehicle_type
       FROM airport_bookings ab
       JOIN airport_services aps ON ab.service_id = aps.id
       WHERE ab.user_id = $1
       ORDER BY ab.booking_date DESC, ab.booking_time DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

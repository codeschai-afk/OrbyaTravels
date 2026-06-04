import { Hono } from 'hono'
import { countries } from './countries.js'
import { listings } from './listings.js'
import { bookings } from './bookings.js'

export const v1 = new Hono()

v1.route('/countries', countries)
v1.route('/listings', listings)
v1.route('/bookings', bookings)

import { Hono } from 'hono'
import { countries } from './countries'
import { listings } from './listings'
import { bookings } from './bookings'

export const v1 = new Hono()

v1.route('/countries', countries)
v1.route('/listings', listings)
v1.route('/bookings', bookings)

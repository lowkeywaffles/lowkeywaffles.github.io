'use client'

import Image from 'next/image'
import { Mail, MapPin, Phone, ChevronDown, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import BookingModal from '@/components/booking-modal'

const PRICES = {
  '2br': { etb: { min: 80000, max: 85000 }, usd: { min: 650, max: 690 } },
  '1br': { etb: { min: 60000, max: 65000 }, usd: { min: 488, max: 528 } },
}

export default function Page() {
  const [scrollY, setScrollY] = useState(0)
  const [bookingModal, setBookingModal] = useState<{
    isOpen: boolean
    roomType: '2br' | '1br'
    roomName: string
  }>({ isOpen: false, roomType: '2br', roomName: '' })

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const openBooking = (roomType: '2br' | '1br', roomName: string) => {
    setBookingModal({ isOpen: true, roomType, roomName })
  }

  const closeBooking = () => {
    setBookingModal({ ...bookingModal, isOpen: false })
  }

  return (
    <main className="bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Maranatha
          </h1>
          <div className="flex gap-4">
            <a
              href="#rooms"
              className="px-4 py-2 text-foreground hover:text-primary transition-colors"
            >
              Units
            </a>
            <button
              onClick={() => openBooking('2br', '2 Bedroom Unit')}
              className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            >
              Book Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero-apartment.png"
            alt="Luxury furnished apartment"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        </div>

        <div
          className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            opacity: 1 - scrollY / 500,
          }}
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight text-balance drop-shadow-lg">
            Premium Furnished Apartments
          </h2>
          <p className="text-xl sm:text-2xl text-gray-50 mb-8 font-light drop-shadow-md">
            Elegant living in the heart of Megenagna
          </p>
          <button
            onClick={() => openBooking('2br', '2 Bedroom Unit')}
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
          >
            Explore & Book
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <ChevronDown className="w-6 h-6 text-white animate-bounce" />
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-gradient-to-r from-secondary/50 to-secondary/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Location</h3>
              <p className="text-muted-foreground">Megenagna, Addis Ababa</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Phone</h3>
              <a href="tel:0911654766" className="text-muted-foreground hover:text-primary transition">
                +251 911 654 766
              </a>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Premium Units</h3>
              <p className="text-muted-foreground">4 Floors • 8 Units Total</p>
            </div>
          </div>
        </div>
      </section>

      {/* Room Types Section */}
      <section id="rooms" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Our Premium Units</h2>
            <p className="text-xl text-muted-foreground">Choose from 2 elegant options on each of our 4 floors</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 2 Bedroom Unit */}
            <div className="group rounded-2xl overflow-hidden border border-border/50 hover:border-primary transition-all duration-300 hover:shadow-2xl">
              <div className="relative h-80 overflow-hidden bg-muted">
                <Image
                  src="/bedroom-2.png"
                  alt="2 Bedroom apartment"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                  Popular
                </div>
              </div>
              <div className="p-8 bg-card relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                <h3 className="text-3xl font-bold text-foreground mb-2">2 Bedroom Unit</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-primary">${PRICES['2br'].usd.min}</span>
                  <span className="text-muted-foreground">— ${PRICES['2br'].usd.max}/month</span>
                </div>
                <div className="text-sm text-muted-foreground mb-6">
                  {PRICES['2br'].etb.min.toLocaleString()} — {PRICES['2br'].etb.max.toLocaleString()} ETB
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Spacious and elegant 2-bedroom apartments designed for comfort and luxury. Perfect for families or
                  professionals seeking extra space.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Master bedroom with ensuite bathroom</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Spacious guest bedroom</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Modern fully equipped kitchen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Living and dining area</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Premium furnishings & appliances</span>
                  </li>
                </ul>
                <button
                  onClick={() => openBooking('2br', '2 Bedroom Unit')}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-md"
                >
                  Book Now
                </button>
              </div>
            </div>

            {/* 1 Bedroom Unit */}
            <div className="group rounded-2xl overflow-hidden border border-border/50 hover:border-primary transition-all duration-300 hover:shadow-2xl">
              <div className="relative h-80 overflow-hidden bg-muted">
                <Image
                  src="/bedroom-1.png"
                  alt="1 Bedroom apartment"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-8 bg-card relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-primary" />
                <h3 className="text-3xl font-bold text-foreground mb-2">1 Bedroom Unit</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-primary">${PRICES['1br'].usd.min}</span>
                  <span className="text-muted-foreground">— ${PRICES['1br'].usd.max}/month</span>
                </div>
                <div className="text-sm text-muted-foreground mb-6">
                  {PRICES['1br'].etb.min.toLocaleString()} — {PRICES['1br'].etb.max.toLocaleString()} ETB
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Intimate and sophisticated 1-bedroom apartments ideal for singles or couples. Every detail carefully
                  curated for maximum comfort.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Spacious bedroom with ample storage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Modern bathroom with premium fixtures</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Kitchenette with all appliances</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Comfortable living and work space</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span className="text-foreground">Modern furnishings & décor</span>
                  </li>
                </ul>
                <button
                  onClick={() => openBooking('1br', '1 Bedroom Unit')}
                  className="w-full bg-gradient-to-r from-accent to-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-md"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-24 bg-gradient-to-b from-secondary/20 to-background border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">Premium Amenities</h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Each unit is meticulously furnished and equipped with modern amenities to ensure your comfort and convenience.
              </p>
              <div className="space-y-4">
                {[
                  'High-speed WiFi & Smart TV',
                  'Air Conditioning & Premium Heating',
                  'Modern Kitchen Appliances',
                  'Quality Bedding & Linens',
                  'Daily Housekeeping Available',
                  'Secure Parking & 24/7 Security',
                  'Washer/Dryer in Unit',
                  'Premium Toiletries & Amenities',
                ].map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent group-hover:scale-150 transition-transform" />
                    <span className="text-foreground">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl border border-border/30">
              <Image src="/amenities.png" alt="Apartment amenities" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Building Structure */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Building Layout</h2>
            <p className="text-xl text-muted-foreground">Intelligently designed for optimal comfort</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((floor) => (
              <div
                key={floor}
                className="group bg-gradient-to-br from-card to-secondary/30 rounded-xl p-6 border border-border/50 hover:border-primary transition-all hover:shadow-lg"
              >
                <h3 className="text-2xl font-bold text-primary mb-4">Floor {floor}</h3>
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 text-sm text-foreground font-semibold group-hover:from-primary/20 group-hover:to-accent/20 transition">
                    Unit A: 2 BR
                  </div>
                  <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-3 text-sm text-foreground font-semibold group-hover:from-accent/20 group-hover:to-primary/20 transition">
                    Unit B: 1 BR
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 border border-border/30 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-3">Total Availability</h3>
            <div className="flex justify-center gap-8 flex-wrap">
              <div>
                <p className="text-4xl font-bold text-primary">4</p>
                <p className="text-muted-foreground">Floors</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">8</p>
                <p className="text-muted-foreground">Total Units</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">4</p>
                <p className="text-muted-foreground">2-Bedroom Units</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">4</p>
                <p className="text-muted-foreground">1-Bedroom Units</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8">Ready to Experience Luxury?</h2>
          <p className="text-lg mb-12 opacity-95">
            Get in touch with us today to schedule a viewing or make a booking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <a
              href="tel:0911654766"
              className="bg-white/20 hover:bg-white/30 transition-all rounded-lg p-6 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <Phone className="w-6 h-6" />
              <span className="text-lg font-semibold">+251 911 654 766</span>
            </a>
            <a
              href="https://maps.google.com/maps?q=Megenagna,+Addis+Ababa"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 transition-all rounded-lg p-6 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <MapPin className="w-6 h-6" />
              <span className="text-lg font-semibold">View on Map</span>
            </a>
          </div>

          <button
            onClick={() => openBooking('2br', '2 Bedroom Unit')}
            className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Book Your Unit Now
          </button>

          <div className="mt-12 bg-white/10 rounded-lg p-8 backdrop-blur-sm border border-white/20">
            <h3 className="text-2xl font-bold mb-4">Visit Our Showroom</h3>
            <p className="text-lg leading-relaxed mb-4 opacity-95">
              Megenagna is Addis Ababa&apos;s premier neighborhood, featuring upscale dining, shopping, and entertainment.
              Our location offers the perfect blend of urban convenience and residential tranquility.
            </p>
            <div className="inline-block text-sm font-semibold border-b-2 border-white/50 pb-1">
              Available for viewings by appointment
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">© 2025 Maranatha Furnished Apartments. All rights reserved.</p>
          <p className="text-sm opacity-75">Premium luxury living in the heart of Addis Ababa</p>
        </div>
      </footer>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={closeBooking}
        roomType={bookingModal.roomType}
        roomName={bookingModal.roomName}
      />
    </main>
  )
}

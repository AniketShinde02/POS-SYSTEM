import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { MapPin, Phone, Mail, Clock, Store } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 space-y-12">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Contact & Store Location</h1>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Have questions about our inventory or store hours? Reach out to our team or visit our retail counter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-[#E85002]" /> Retail Counter Info
              </h2>

              <div className="space-y-4 text-xs font-medium text-zinc-300">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#E85002] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Address</span>
                    <p className="text-zinc-400">Main Retail Market, Plot 42, Commercial Zone, City Center</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#E85002] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Phone</span>
                    <p className="text-zinc-400">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#E85002] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Email</span>
                    <p className="text-zinc-400">support@store.local</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#E85002] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Operating Hours</span>
                    <p className="text-zinc-400">Open 7 Days: 9:00 AM – 9:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
              <h2 className="text-xl font-bold text-white">Send Us a Message</h2>
              <p className="text-xs text-zinc-400">Fill in your inquiry and our store manager will reply promptly.</p>

              <form className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 focus:outline-none focus:border-[#E85002]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 focus:outline-none focus:border-[#E85002]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Message</label>
                  <textarea
                    rows={4}
                    placeholder="How can we help you?"
                    className="w-full p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 focus:outline-none focus:border-[#E85002]"
                  />
                </div>
                <button
                  type="button"
                  className="w-full h-10 rounded-lg bg-[#E85002] hover:bg-[#FF5F12] font-bold text-xs text-white shadow-md shadow-[#E85002]/20 transition-all"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

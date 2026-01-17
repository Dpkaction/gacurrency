import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Globe, User, Mail, Phone, MapPin, Send, Loader2, Star, Users, Award } from "lucide-react";

const Ambassador = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    motivation: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.fullName || !formData.email || !formData.country || !formData.username) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Application Submitted!",
      description: "Thank you for your interest. We'll review your application and get back to you soon.",
    });

    // Reset form
    setFormData({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      country: "",
      city: "",
      motivation: "",
    });

    setIsSubmitting(false);
  };

  const benefits = [
    {
      icon: Star,
      title: "Exclusive Access",
      description: "Early access to new features and updates before public release",
    },
    {
      icon: Users,
      title: "Community Leadership",
      description: "Lead and grow the VAGS community in your region",
    },
    {
      icon: Award,
      title: "Rewards Program",
      description: "Earn GSC bonuses for successful referrals and contributions",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4 animate-fade-in-up">
              Join Our Network
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up delay-100">
              Become a <span className="text-gradient-gold">VAGS Ambassador</span>
            </h1>
            <p className="text-muted-foreground text-lg animate-fade-in-up delay-200">
              Help us build the future of sustainable digital finance. Represent VAGS in your region 
              and be part of the revolution.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="glass-card p-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 relative">
        <div className="absolute left-0 top-1/2 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Apply to be an <span className="text-gradient-gold">Ambassador</span>
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below and we'll get back to you
              </p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-8 md:p-10 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gold" />
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="bg-input border-border focus:border-gold"
                    required
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gold" />
                    VAGS Username *
                  </Label>
                  <Input
                    id="username"
                    placeholder="Your VAGS username"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    className="bg-input border-border focus:border-gold"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gold" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="bg-input border-border focus:border-gold"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gold" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="bg-input border-border focus:border-gold"
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gold" />
                    Country *
                  </Label>
                  <Input
                    id="country"
                    placeholder="Your country"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="bg-input border-border focus:border-gold"
                    required
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" />
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="Your city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="bg-input border-border focus:border-gold"
                  />
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-2">
                <Label htmlFor="motivation" className="flex items-center gap-2">
                  Why do you want to be a VAGS Ambassador?
                </Label>
                <Textarea
                  id="motivation"
                  placeholder="Tell us about yourself and why you're passionate about VAGS..."
                  value={formData.motivation}
                  onChange={(e) => handleChange("motivation", e.target.value)}
                  className="bg-input border-border focus:border-gold min-h-[120px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full btn-gold py-6 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Ambassador;

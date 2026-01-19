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

    try {
      // First, let's test if the bot token is valid
      const botToken = "8235026634:AAE0tNMsvAODsst9h9WhAXAtdjSF2N13wOQ";
      
      // Test bot token validity first
      console.log("Testing bot token validity...");
      try {
        const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const botInfo = await botInfoResponse.json();
        console.log("Bot info:", botInfo);
        
        if (!botInfo.ok) {
          throw new Error(`Invalid bot token: ${botInfo.description}`);
        }
      } catch (tokenError) {
        console.error("Bot token validation failed:", tokenError);
        toast({
          title: "Configuration Error",
          description: "Bot token is invalid. Please check the bot configuration.",
          variant: "destructive",
        });
        return;
      }
      
      const message = `🌟 New VAGS Ambassador Application

👤 Full Name: ${formData.fullName}
🏷️ Username: ${formData.username}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone || "Not provided"}
🌍 Country: ${formData.country}
🏙️ City: ${formData.city || "Not provided"}

💭 Motivation:
${formData.motivation || "Not provided"}

📅 Submitted: ${new Date().toLocaleString()}`;

      let success = false;
      let errorDetails = "";
      
      // Try different chat ID formats - the bot might need to be contacted directly
      const chatConfigs = [
        "@gscambassador_bot",
        "gscambassador_bot",
        // If the above don't work, we'll need the actual chat ID number
      ];
      
      for (const chatId of chatConfigs) {
        try {
          console.log(`Attempting to send to chat ID: ${chatId}`);
          
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message
            })
          });
          
          const responseData = await response.json();
          console.log(`Telegram API response for ${chatId}:`, responseData);
          
          if (response.ok && responseData.ok) {
            success = true;
            console.log("Successfully sent to Telegram!");
            break;
          } else {
            errorDetails += `Chat ID ${chatId}: ${responseData.description || responseData.error_code || 'Unknown error'}. `;
            
            // If it's a "chat not found" error, the bot username might be wrong
            if (responseData.description && responseData.description.includes("chat not found")) {
              errorDetails += "Bot username may not exist or bot hasn't been started. ";
            }
          }
        } catch (apiError) {
          console.log(`API call failed for chat ID ${chatId}:`, apiError);
          errorDetails += `Chat ID ${chatId}: ${apiError.message}. `;
        }
      }
      
      // If direct API calls fail, try alternative approach
      if (!success) {
        console.log("Direct API failed, trying alternative methods...");
        
        // Create a simple webhook test
        try {
          const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
          const testData = await testResponse.json();
          console.log("Bot updates test:", testData);
          
          if (testData.ok) {
            errorDetails += "Bot is working but chat ID is incorrect. ";
            
            // If there are updates, we can get the correct chat ID
            if (testData.result && testData.result.length > 0) {
              const lastUpdate = testData.result[testData.result.length - 1];
              if (lastUpdate.message && lastUpdate.message.chat) {
                const correctChatId = lastUpdate.message.chat.id;
                console.log("Found correct chat ID:", correctChatId);
                
                // Try with the correct chat ID
                try {
                  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      chat_id: correctChatId,
                      text: message
                    })
                  });
                  
                  const responseData = await response.json();
                  if (response.ok && responseData.ok) {
                    success = true;
                    console.log("Successfully sent using discovered chat ID!");
                  }
                } catch (finalError) {
                  console.log("Final attempt failed:", finalError);
                }
              }
            }
          }
        } catch (alternativeError) {
          console.log("Alternative method failed:", alternativeError);
          errorDetails += `Alternative method error: ${alternativeError.message}. `;
        }
      }

      if (success) {
        toast({
          title: "Application Submitted!",
          description: "Your application has been successfully sent to @gscambassador_bot on network.",
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
      } else {
        // Log detailed error information for debugging
        console.error("All Telegram API methods failed. Error details:", errorDetails);
        
        toast({
          title: "Bot Configuration Issue",
          description: `Failed to send to @gscambassador_bot. Error: ${errorDetails.substring(0, 100)}... Check console for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to broadcast to network. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

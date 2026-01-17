import { Pickaxe, Wallet, Globe, Check, Clock, ArrowRight } from "lucide-react";

const phases = [
  {
    id: 1,
    title: "Mining Phase",
    subtitle: "Distributed Mining",
    description: "Participate in the distributed mining process using Proof of Time Zone (PoTZ) consensus. Earn VAGS tokens backed by real gold and silver.",
    icon: Pickaxe,
    status: "active",
    features: ["PoTZ Validation", "Distributed Network", "Fair Distribution"],
  },
  {
    id: 2,
    title: "Wallet Creation",
    subtitle: "Secure Storage",
    description: "Create your non-custodial wallet with private key generation and 12-24 word seed phrase recovery. Full control of your assets.",
    icon: Wallet,
    status: "upcoming",
    features: ["Private Keys", "Seed Phrase Backup", "Multi-Currency View"],
  },
  {
    id: 3,
    title: "Market Launch",
    subtitle: "Global Transactions",
    description: "VAGS becomes available for worldwide transactions. Trade, transfer, and utilize your metal-backed digital assets globally.",
    icon: Globe,
    status: "upcoming",
    features: ["P2P Transactions", "Exchange Listing", "Global Access"],
  },
];

const PhaseIcon = ({ Icon, status }: { Icon: any; status: string }) => (
  <div
    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
      status === "active"
        ? "bg-gradient-gold glow-gold"
        : "glass-card border-silver/20"
    }`}
  >
    <Icon
      className={`w-8 h-8 ${
        status === "active" ? "text-midnight" : "text-silver"
      }`}
    />
    {status === "active" && (
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center">
        <Check className="w-3 h-3 text-success-foreground" />
      </div>
    )}
    {status === "upcoming" && (
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted flex items-center justify-center">
        <Clock className="w-3 h-3 text-muted-foreground" />
      </div>
    )}
  </div>
);

const PhasesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden" id="phases">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-midnight-light/50 to-background" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-foreground">Project </span>
            <span className="text-gradient-gold">Roadmap</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our three-phase journey to revolutionize the global financial system with metal-backed digital assets.
          </p>
        </div>

        {/* Phases Grid */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-0.5">
            <div className="h-full bg-gradient-to-r from-gold via-silver/30 to-silver/10" />
          </div>

          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className={`relative animate-fade-in-up`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Phase Card */}
              <div
                className={`glass-card p-8 h-full transition-all duration-500 hover:scale-[1.02] ${
                  phase.status === "active"
                    ? "border-gold/30 glow-gold-sm"
                    : "hover:border-silver/30"
                }`}
              >
                {/* Icon & Phase Number */}
                <div className="flex items-start justify-between mb-6">
                  <PhaseIcon Icon={phase.icon} status={phase.status} />
                  <span
                    className={`font-display text-6xl font-bold ${
                      phase.status === "active" ? "text-gold/20" : "text-silver/10"
                    }`}
                  >
                    {String(phase.id).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      phase.status === "active" ? "text-gold" : "text-silver"
                    }`}
                  >
                    {phase.subtitle}
                  </span>
                  <h3 className="font-display text-xl font-bold mt-2 mb-3">
                    {phase.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {phase.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {phase.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-foreground/70"
                    >
                      <ArrowRight
                        className={`w-3 h-3 ${
                          phase.status === "active" ? "text-gold" : "text-silver"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Status Badge */}
                <div className="mt-6 pt-6 border-t border-border">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      phase.status === "active"
                        ? "bg-gold/10 text-gold"
                        : "bg-silver/10 text-silver"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        phase.status === "active"
                          ? "bg-gold animate-pulse"
                          : "bg-silver"
                      }`}
                    />
                    {phase.status === "active" ? "Currently Active" : "Coming Soon"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhasesSection;

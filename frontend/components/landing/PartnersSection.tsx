const PARTNERS = [
  { name: "VTV7" },
  { name: "Thanh Niên" },
  { name: "Tuổi Trẻ" },
  { name: "Nhân Dân" },
  { name: "Edu2Review" },
  { name: "VTV24" },
];

export default function PartnersSection() {
  return (
    <section className="py-20 bg-card/50 border-y border-primary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm text-muted-foreground font-medium mb-2">
            Trusted by leading organizations
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Đối tác của <span className="text-primary">Noble Language Academy</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="w-full h-20 rounded-2xl bg-background border border-border flex items-center justify-center opacity-70 hover:opacity-100 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              {/* Replace with <Image src={partner.logo} /> when real logos are available */}
              <span className="text-sm font-bold text-muted-foreground text-center px-2">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

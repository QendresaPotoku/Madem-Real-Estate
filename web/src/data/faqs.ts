import type { Localized } from "@/i18n/types";

export interface FAQ {
  id: string;
  question: Localized;
  answer: Localized;
  category: "Buying" | "Renting" | "Selling" | "Agency";
}

export const faqs: FAQ[] = [
  {
    id: "f1",
    question: {
      en: "What is the process for buying property in Kosovo?",
      sq: "Cili është procesi për blerjen e pronës në Kosovë?",
      de: "Wie läuft der Immobilienkauf im Kosovo ab?",
    },
    answer: {
      en: "The process begins with property selection and a preliminary agreement, followed by a deposit. The main step is drafting the sales contract, which must be notarized. Both parties sign the contract at the notary's office. Finally, the property is registered under the buyer's name at the Municipal Cadastral Office.",
      sq: "Procesi fillon me përzgjedhjen e pronës dhe një marrëveshje paraprake, e ndjekur nga një kapar. Hapi kryesor është hartimi i kontratës së shitblerjes, e cila duhet të noterizohet. Të dyja palët e nënshkruajnë kontratën në zyrën e noterit. Në fund, prona regjistrohet në emër të blerësit në Zyrën Komunale Kadastrale.",
      de: "Der Prozess beginnt mit der Auswahl der Immobilie und einer Vorvereinbarung, gefolgt von einer Anzahlung. Der wichtigste Schritt ist die Erstellung des Kaufvertrags, der notariell beurkundet werden muss. Beide Parteien unterzeichnen den Vertrag beim Notar. Schließlich wird die Immobilie beim kommunalen Katasteramt auf den Namen des Käufers eingetragen.",
    },
    category: "Buying",
  },
  {
    id: "f2",
    question: {
      en: "Can foreign nationals buy property in Kosovo?",
      sq: "A mund të blejnë pronë në Kosovë shtetasit e huaj?",
      de: "Können ausländische Staatsbürger im Kosovo Immobilien kaufen?",
    },
    answer: {
      en: "Yes, foreign nationals can purchase residential and commercial property in Kosovo. The Law on Foreign Investment guarantees foreign investors the same rights as local citizens regarding property ownership, though specific regulations may apply to agricultural land.",
      sq: "Po, shtetasit e huaj mund të blejnë pronë banimi dhe komerciale në Kosovë. Ligji për Investimet e Huaja u garanton investitorëve të huaj të njëjtat të drejta si qytetarëve vendas përsa i përket pronësisë, megjithëse rregulla të veçanta mund të zbatohen për tokën bujqësore.",
      de: "Ja, ausländische Staatsbürger können im Kosovo Wohn- und Gewerbeimmobilien erwerben. Das Gesetz über ausländische Investitionen garantiert ausländischen Investoren dieselben Eigentumsrechte wie einheimischen Bürgern, wobei für landwirtschaftliche Flächen besondere Vorschriften gelten können.",
    },
    category: "Buying",
  },
  {
    id: "f3",
    question: {
      en: "What additional costs should I expect when buying?",
      sq: "Cilat kosto shtesë duhet të pres gjatë blerjes?",
      de: "Mit welchen Zusatzkosten muss ich beim Kauf rechnen?",
    },
    answer: {
      en: "Buyers should budget for notary fees (which vary based on property value), property transfer tax (if applicable), and agency commission. Legal fees for contract review and potential translation services should also be considered. Generally, these costs add approximately 1.5% to 3% to the purchase price.",
      sq: "Blerësit duhet të planifikojnë tarifat e noterit (që ndryshojnë sipas vlerës së pronës), tatimin në bartjen e pronës (nëse aplikohet) dhe komisionin e agjencisë. Duhen marrë parasysh gjithashtu tarifat ligjore për shqyrtimin e kontratës dhe shërbimet e mundshme të përkthimit. Në përgjithësi, këto kosto shtojnë afërsisht 1.5% deri në 3% në çmimin e blerjes.",
      de: "Käufer sollten Notargebühren (die je nach Immobilienwert variieren), die Grunderwerbsteuer (sofern zutreffend) und die Maklerprovision einplanen. Auch Anwaltskosten für die Vertragsprüfung und mögliche Übersetzungsdienste sollten berücksichtigt werden. In der Regel erhöhen diese Kosten den Kaufpreis um etwa 1,5 % bis 3 %.",
    },
    category: "Buying",
  },
  {
    id: "f4",
    question: {
      en: "How long does the buying process take?",
      sq: "Sa zgjat procesi i blerjes?",
      de: "Wie lange dauert der Kaufprozess?",
    },
    answer: {
      en: "If the property has clear documentation and no legal disputes, the process from signing the pre-contract to the final notary act and transfer of funds can be completed in 1 to 3 weeks. Cadastral registration may take an additional 15 to 30 days.",
      sq: "Nëse prona ka dokumentacion të qartë dhe nuk ka konteste ligjore, procesi nga nënshkrimi i parakontratës deri te akti përfundimtar noterial dhe transferi i mjeteve mund të përfundojë brenda 1 deri në 3 javë. Regjistrimi kadastral mund të marrë edhe 15 deri në 30 ditë shtesë.",
      de: "Wenn die Immobilie über eine klare Dokumentation verfügt und keine Rechtsstreitigkeiten bestehen, kann der Prozess von der Unterzeichnung des Vorvertrags bis zur endgültigen notariellen Beurkundung und Geldüberweisung in 1 bis 3 Wochen abgeschlossen werden. Die Katastereintragung kann weitere 15 bis 30 Tage in Anspruch nehmen.",
    },
    category: "Buying",
  },
  {
    id: "f5",
    question: {
      en: "What is the standard lease term for a rental property?",
      sq: "Cili është afati standard i qirasë për një pronë me qira?",
      de: "Wie lange ist die übliche Mietdauer für eine Mietimmobilie?",
    },
    answer: {
      en: "The standard lease term for residential properties is 12 months. For commercial properties, lease terms are typically longer, ranging from 3 to 5 years, often with options to renew. Shorter terms can sometimes be negotiated but may incur a higher monthly rate.",
      sq: "Afati standard i qirasë për pronat e banimit është 12 muaj. Për pronat komerciale, afatet e qirasë janë zakonisht më të gjata, nga 3 deri në 5 vjet, shpesh me mundësi rinovimi. Afate më të shkurtra ndonjëherë mund të negociohen, por mund të kenë një çmim më të lartë mujor.",
      de: "Die übliche Mietdauer für Wohnimmobilien beträgt 12 Monate. Bei Gewerbeimmobilien sind die Mietlaufzeiten in der Regel länger und reichen von 3 bis 5 Jahren, oft mit Verlängerungsoptionen. Kürzere Laufzeiten lassen sich manchmal aushandeln, können jedoch zu einer höheren Monatsmiete führen.",
    },
    category: "Renting",
  },
  {
    id: "f6",
    question: {
      en: "Is a security deposit required for rentals?",
      sq: "A kërkohet depozitë sigurie për qiratë?",
      de: "Ist bei Mietverhältnissen eine Kaution erforderlich?",
    },
    answer: {
      en: "Yes, a security deposit is standard practice. It is typically equivalent to one month's rent for residential properties and up to three months' rent for commercial spaces. The deposit is held to cover any potential damages or unpaid utility bills at the end of the tenancy.",
      sq: "Po, depozita e sigurisë është praktikë standarde. Ajo zakonisht është e barabartë me qiranë e një muaji për pronat e banimit dhe deri në tre muaj qira për hapësirat komerciale. Depozita mbahet për të mbuluar dëmtimet e mundshme ose faturat e papaguara të shërbimeve në fund të qiramarrjes.",
      de: "Ja, eine Kaution ist üblich. Sie entspricht in der Regel einer Monatsmiete bei Wohnimmobilien und bis zu drei Monatsmieten bei Gewerbeflächen. Die Kaution wird einbehalten, um etwaige Schäden oder unbezahlte Nebenkostenrechnungen am Ende des Mietverhältnisses abzudecken.",
    },
    category: "Renting",
  },
  {
    id: "f7",
    question: {
      en: "Who is responsible for property maintenance during a lease?",
      sq: "Kush është përgjegjës për mirëmbajtjen e pronës gjatë qirasë?",
      de: "Wer ist während der Mietzeit für die Instandhaltung der Immobilie verantwortlich?",
    },
    answer: {
      en: "Generally, the landlord is responsible for major structural repairs and maintaining the essential systems (plumbing, heating, electrical). The tenant is responsible for day-to-day maintenance, minor repairs, and keeping the property in good condition. Specifics are outlined in the lease agreement.",
      sq: "Në përgjithësi, qiradhënësi është përgjegjës për riparimet kryesore strukturore dhe mirëmbajtjen e sistemeve thelbësore (hidraulike, ngrohje, elektrike). Qiramarrësi është përgjegjës për mirëmbajtjen e përditshme, riparimet e vogla dhe mbajtjen e pronës në gjendje të mirë. Detajet specifikohen në marrëveshjen e qirasë.",
      de: "In der Regel ist der Vermieter für größere bauliche Reparaturen und die Instandhaltung der wesentlichen Systeme (Sanitär, Heizung, Elektrik) verantwortlich. Der Mieter ist für die laufende Instandhaltung, kleinere Reparaturen und den guten Zustand der Immobilie zuständig. Die Einzelheiten sind im Mietvertrag festgelegt.",
    },
    category: "Renting",
  },
  {
    id: "f8",
    question: {
      en: "How does MADEM evaluate a property's market value?",
      sq: "Si e vlerëson MADEM vlerën e tregut të një prone?",
      de: "Wie ermittelt MADEM den Marktwert einer Immobilie?",
    },
    answer: {
      en: "Our valuation process involves a comprehensive comparative market analysis (CMA). We consider the property's location, size, condition, amenities, recent sales of similar properties in the area, and current market trends to determine an accurate and competitive listing price.",
      sq: "Procesi ynë i vlerësimit përfshin një analizë gjithëpërfshirëse krahasuese të tregut (CMA). Marrim parasysh lokacionin, madhësinë, gjendjen, komoditetet e pronës, shitjet e fundit të pronave të ngjashme në zonë dhe trendet aktuale të tregut për të përcaktuar një çmim të saktë dhe konkurrues.",
      de: "Unser Bewertungsverfahren umfasst eine umfassende vergleichende Marktanalyse (CMA). Wir berücksichtigen Lage, Größe, Zustand und Ausstattung der Immobilie, jüngste Verkäufe vergleichbarer Objekte in der Umgebung sowie aktuelle Markttrends, um einen genauen und wettbewerbsfähigen Angebotspreis festzulegen.",
    },
    category: "Selling",
  },
  {
    id: "f9",
    question: {
      en: "What documents do I need to sell my property?",
      sq: "Cilat dokumente më duhen për të shitur pronën time?",
      de: "Welche Dokumente benötige ich für den Verkauf meiner Immobilie?",
    },
    answer: {
      en: "You will need the original Certificate of Ownership (Fleta Poseduese), a valid ID or passport, a copy of the property plan, and confirmation from the municipality that all property taxes have been paid up to date. If the property was inherited or acquired through a court decision, those documents are also required.",
      sq: "Do t'ju nevojitet Certifikata origjinale e Pronësisë (Fleta Poseduese), një letërnjoftim ose pasaportë e vlefshme, një kopje e planit të pronës dhe konfirmimi nga komuna se të gjitha tatimet në pronë janë paguar deri në ditën aktuale. Nëse prona është trashëguar ose fituar përmes një vendimi gjyqësor, kërkohen edhe ato dokumente.",
      de: "Sie benötigen die Original-Eigentumsurkunde (Fleta Poseduese), einen gültigen Ausweis oder Reisepass, eine Kopie des Lageplans der Immobilie sowie eine Bestätigung der Gemeinde, dass alle Grundsteuern bis dato bezahlt sind. Wurde die Immobilie geerbt oder durch ein Gerichtsurteil erworben, sind auch diese Unterlagen erforderlich.",
    },
    category: "Selling",
  },
  {
    id: "f10",
    question: {
      en: "How can I make my property more attractive to buyers?",
      sq: "Si mund ta bëj pronën time më tërheqëse për blerësit?",
      de: "Wie kann ich meine Immobilie für Käufer attraktiver machen?",
    },
    answer: {
      en: "First impressions matter. We recommend deep cleaning, decluttering, and completing any minor repairs (fixing leaks, painting walls in neutral colors). Enhancing curb appeal and ensuring the property is well-lit for viewings also significantly impact buyer perception. Professional staging can further elevate the property's appeal.",
      sq: "Përshtypjet e para kanë rëndësi. Rekomandojmë pastrim të thellë, heqjen e gjërave të tepërta dhe kryerjen e riparimeve të vogla (rregullimin e rrjedhjeve, lyerjen e mureve me ngjyra neutrale). Përmirësimi i pamjes së jashtme dhe sigurimi që prona të jetë e ndriçuar mirë gjatë vizitave ndikojnë gjithashtu ndjeshëm te perceptimi i blerësit. Prezantimi profesional mund ta ngrejë edhe më shumë atraktivitetin e pronës.",
      de: "Der erste Eindruck zählt. Wir empfehlen eine Grundreinigung, das Entrümpeln und die Durchführung kleinerer Reparaturen (Lecks beheben, Wände in neutralen Farben streichen). Auch die Verbesserung der Außenwirkung und eine gute Beleuchtung bei Besichtigungen beeinflussen die Wahrnehmung der Käufer erheblich. Professionelles Home Staging kann die Attraktivität der Immobilie zusätzlich steigern.",
    },
    category: "Selling",
  },
  {
    id: "f11",
    question: {
      en: "Do I have to pay capital gains tax when selling?",
      sq: "A duhet të paguaj tatim mbi fitimin kapital gjatë shitjes?",
      de: "Muss ich beim Verkauf Kapitalertragsteuer zahlen?",
    },
    answer: {
      en: "Currently, Kosovo does not impose a capital gains tax on the sale of residential property for individuals, provided it is not considered a commercial business activity. However, tax laws are subject to change, and we recommend consulting with a tax professional for the most up-to-date advice.",
      sq: "Aktualisht, Kosova nuk vendos tatim mbi fitimin kapital për shitjen e pronës së banimit nga individët, me kusht që kjo të mos konsiderohet veprimtari tregtare biznesi. Megjithatë, ligjet tatimore mund të ndryshojnë dhe ne rekomandojmë konsultimin me një profesionist tatimor për këshillat më të fundit.",
      de: "Derzeit erhebt der Kosovo beim Verkauf von Wohnimmobilien durch Privatpersonen keine Kapitalertragsteuer, sofern dies nicht als gewerbliche Tätigkeit gilt. Steuergesetze können sich jedoch ändern, und wir empfehlen, für die aktuellsten Auskünfte einen Steuerberater zu konsultieren.",
    },
    category: "Selling",
  },
  {
    id: "f12",
    question: {
      en: "What makes MADEM different from other agencies?",
      sq: "Çfarë e bën MADEM të ndryshme nga agjencitë e tjera?",
      de: "Was unterscheidet MADEM von anderen Agenturen?",
    },
    answer: {
      en: "MADEM specializes exclusively in premium real estate. We offer a highly personalized, discreet service tailored to high-net-worth individuals, investors, and corporate clients. Our focus is on quality over quantity, ensuring every property we list meets stringent standards of excellence.",
      sq: "MADEM specializohet ekskluzivisht në patundshmëri premium. Ofrojmë një shërbim shumë të personalizuar dhe diskret, të përshtatur për individë me pasuri të lartë, investitorë dhe klientë korporativë. Fokusi ynë është te cilësia mbi sasinë, duke siguruar që çdo pronë që listojmë t'i përmbushë standardet e rrepta të përsosmërisë.",
      de: "MADEM ist ausschließlich auf Premium-Immobilien spezialisiert. Wir bieten einen hochgradig persönlichen, diskreten Service, der auf vermögende Privatpersonen, Investoren und Firmenkunden zugeschnitten ist. Unser Fokus liegt auf Qualität statt Quantität, sodass jede von uns angebotene Immobilie strengen Exzellenzstandards entspricht.",
    },
    category: "Agency",
  },
  {
    id: "f13",
    question: {
      en: "Do you offer property management services?",
      sq: "A ofroni shërbime të menaxhimit të pronës?",
      de: "Bieten Sie Hausverwaltungsdienste an?",
    },
    answer: {
      en: "Yes, we offer comprehensive property management services for our investor clients. This includes tenant screening, rent collection, regular maintenance, emergency repairs, and detailed financial reporting, ensuring your investment is protected and yields consistent returns.",
      sq: "Po, ofrojmë shërbime gjithëpërfshirëse të menaxhimit të pronës për klientët tanë investitorë. Kjo përfshin verifikimin e qiramarrësve, mbledhjen e qirasë, mirëmbajtjen e rregullt, riparimet emergjente dhe raportimin e detajuar financiar, duke siguruar që investimi juaj të mbrohet dhe të japë kthime të qëndrueshme.",
      de: "Ja, wir bieten unseren Investorenkunden umfassende Hausverwaltungsdienste. Dazu gehören die Mieterauswahl, der Mieteinzug, regelmäßige Instandhaltung, Notfallreparaturen und eine detaillierte Finanzberichterstattung, damit Ihre Investition geschützt ist und beständige Erträge erzielt.",
    },
    category: "Agency",
  },
  {
    id: "f14",
    question: {
      en: "What are your agency fees?",
      sq: "Cilat janë tarifat e agjencisë suaj?",
      de: "Wie hoch sind Ihre Agenturgebühren?",
    },
    answer: {
      en: "Our standard commission for property sales is 2% to 3% of the final sale price, typically paid by the seller, though this can be negotiated based on the specific agreement. For rentals, our fee is equivalent to one month's rent. All fees are transparently outlined in our brokerage agreements.",
      sq: "Komisioni ynë standard për shitjen e pronave është 2% deri në 3% të çmimit përfundimtar të shitjes, zakonisht i paguar nga shitësi, megjithëse kjo mund të negociohet sipas marrëveshjes specifike. Për qiratë, tarifa jonë është e barabartë me qiranë e një muaji. Të gjitha tarifat janë të përshkruara në mënyrë transparente në marrëveshjet tona të ndërmjetësimit.",
      de: "Unsere Standardprovision beim Immobilienverkauf beträgt 2 % bis 3 % des endgültigen Verkaufspreises, in der Regel vom Verkäufer zu zahlen, kann jedoch je nach individueller Vereinbarung verhandelt werden. Bei Vermietungen entspricht unsere Gebühr einer Monatsmiete. Alle Gebühren sind in unseren Maklerverträgen transparent aufgeführt.",
    },
    category: "Agency",
  },
  {
    id: "f15",
    question: {
      en: "How do you market luxury properties?",
      sq: "Si i promovoni pronat luksoze?",
      de: "Wie vermarkten Sie Luxusimmobilien?",
    },
    answer: {
      en: "Luxury properties require specialized marketing. We utilize professional architectural photography, cinematic video tours, and targeted digital marketing campaigns. Listings are featured on our premium portal, shared within our exclusive network of private clients and investors, and promoted through high-end lifestyle publications.",
      sq: "Pronat luksoze kërkojnë marketing të specializuar. Përdorim fotografi profesionale arkitekturore, tura video kinematografike dhe fushata të targetuara të marketingut digjital. Listimet shfaqen në portalin tonë premium, ndahen brenda rrjetit tonë ekskluziv të klientëve privatë dhe investitorëve dhe promovohen përmes publikimeve ekskluzive të stilit të jetesës.",
      de: "Luxusimmobilien erfordern spezialisiertes Marketing. Wir setzen professionelle Architekturfotografie, filmische Videotouren und gezielte digitale Marketingkampagnen ein. Die Angebote werden auf unserem Premium-Portal präsentiert, innerhalb unseres exklusiven Netzwerks aus Privatkunden und Investoren geteilt und über hochwertige Lifestyle-Publikationen beworben.",
    },
    category: "Agency",
  },
];

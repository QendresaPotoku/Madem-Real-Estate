import type { Localized } from "@/i18n/types";

export interface Testimonial {
  id: string;
  name: string;
  role: Localized;
  city: string;
  content: Localized;
  rating: number;
  image: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Ilir Krasniqi",
    role: { en: "Tech Entrepreneur", sq: "Sipërmarrës teknologjik", de: "Tech-Unternehmer" },
    city: "Prishtine",
    content: {
      en: "MADEM understood exactly what I was looking for. Their discretion and efficiency in securing my penthouse in Dragodan were exceptional. The process felt effortless.",
      sq: "MADEM e kuptoi saktësisht atë që po kërkoja. Diskrecioni dhe efikasiteti i tyre në sigurimin e penthouse-it tim në Dragodan ishin të jashtëzakonshëm. Procesi u ndje pa asnjë mundim.",
      de: "MADEM hat genau verstanden, wonach ich gesucht habe. Ihre Diskretion und Effizienz beim Erwerb meines Penthouses in Dragodan waren außergewöhnlich. Der gesamte Prozess verlief mühelos.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test1/200/200",
  },
  {
    id: "t2",
    name: "Sarah Jenkins",
    role: { en: "Diplomat", sq: "Diplomate", de: "Diplomatin" },
    city: "Prishtine",
    content: {
      en: "Relocating to a new country is stressful, but the team at MADEM made finding a secure, high-quality family home incredibly smooth. Their knowledge of the premium market is unmatched.",
      sq: "Zhvendosja në një vend të ri është stresuese, por ekipi i MADEM e bëri jashtëzakonisht të lehtë gjetjen e një shtëpie familjare të sigurt dhe cilësore. Njohuritë e tyre për tregun premium janë të pakrahasueshme.",
      de: "Der Umzug in ein neues Land ist stressig, doch das Team von MADEM machte die Suche nach einem sicheren, hochwertigen Familienheim unglaublich reibungslos. Ihr Wissen über den Premium-Markt ist unübertroffen.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test2/200/200",
  },
  {
    id: "t3",
    name: "Besnik Gashi",
    role: { en: "Property Investor", sq: "Investitor në patundshmëri", de: "Immobilieninvestor" },
    city: "Prizren",
    content: {
      en: "I have worked with several agencies in Kosovo, but MADEM stands out for their analytical approach to commercial real estate. They don't just sell properties; they offer sound investment advice.",
      sq: "Kam punuar me disa agjenci në Kosovë, por MADEM dallon për qasjen e tyre analitike ndaj patundshmërive komerciale. Ata nuk shesin thjesht prona; ata ofrojnë këshilla të shëndosha investimi.",
      de: "Ich habe mit mehreren Agenturen im Kosovo zusammengearbeitet, doch MADEM hebt sich durch seinen analytischen Ansatz bei Gewerbeimmobilien ab. Sie verkaufen nicht nur Immobilien, sondern bieten fundierte Anlageberatung.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test3/200/200",
  },
  {
    id: "t4",
    name: "Elena Kelmendi",
    role: { en: "Architect", sq: "Arkitekte", de: "Architektin" },
    city: "Peje",
    content: {
      en: "As an architect, I am very particular about the properties I invest in. MADEM presented me with a selection of historically significant homes that perfectly matched my restoration vision.",
      sq: "Si arkitekte, jam shumë e kërkueshme për pronat në të cilat investoj. MADEM më prezantoi me një përzgjedhje shtëpish me rëndësi historike që përputheshin përsosmërisht me vizionin tim të restaurimit.",
      de: "Als Architektin bin ich bei den Immobilien, in die ich investiere, sehr wählerisch. MADEM präsentierte mir eine Auswahl historisch bedeutender Häuser, die perfekt zu meiner Restaurierungsvision passten.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test4/200/200",
  },
  {
    id: "t5",
    name: "Markus Weber",
    role: { en: "Corporate Executive", sq: "Drejtues korporate", de: "Führungskraft" },
    city: "Prishtine",
    content: {
      en: "We partnered with MADEM to secure office space for our new regional headquarters. Their negotiation skills and understanding of corporate leasing requirements saved us significant time and capital.",
      sq: "Bashkëpunuam me MADEM për të siguruar hapësirë zyre për selinë tonë të re rajonale. Aftësitë e tyre negociuese dhe kuptimi i kërkesave të qirasë korporative na kursyen kohë dhe kapital të konsiderueshëm.",
      de: "Wir haben mit MADEM zusammengearbeitet, um Büroflächen für unsere neue regionale Zentrale zu sichern. Ihr Verhandlungsgeschick und ihr Verständnis für die Anforderungen von Unternehmensmietverträgen ersparten uns viel Zeit und Kapital.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test5/200/200",
  },
  {
    id: "t6",
    name: "Afrim Hoxha",
    role: { en: "Business Owner", sq: "Pronar biznesi", de: "Geschäftsinhaber" },
    city: "Ferizaj",
    content: {
      en: "The level of professionalism and service provided by MADEM is a rarity. They handled the sale of my commercial warehouse with the utmost confidentiality and secured a buyer swiftly.",
      sq: "Niveli i profesionalizmit dhe shërbimit i ofruar nga MADEM është një rrallësi. Ata e trajtuan shitjen e depos sime komerciale me konfidencialitetin më të lartë dhe siguruan një blerës me shpejtësi.",
      de: "Das Maß an Professionalität und Service, das MADEM bietet, ist selten. Sie wickelten den Verkauf meines Gewerbelagers mit größter Vertraulichkeit ab und fanden zügig einen Käufer.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test6/200/200",
  },
  {
    id: "t7",
    name: "Vjosa Rexhepi",
    role: { en: "Private Investor", sq: "Investitore private", de: "Privatinvestorin" },
    city: "Prishtine",
    content: {
      en: "MADEM’s portfolio of exclusive listings is exactly what sophisticated buyers need. Their agents are polite, incredibly knowledgeable, and truly understand the meaning of luxury service.",
      sq: "Portofoli i MADEM me listime ekskluzive është pikërisht ajo që u nevojitet blerësve të sofistikuar. Agjentët e tyre janë të sjellshëm, jashtëzakonisht të ditur dhe e kuptojnë vërtet kuptimin e shërbimit luksoz.",
      de: "Das Portfolio exklusiver Angebote von MADEM ist genau das, was anspruchsvolle Käufer brauchen. Ihre Makler sind höflich, unglaublich kompetent und verstehen wirklich, was Luxusservice bedeutet.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test7/200/200",
  },
  {
    id: "t8",
    name: "Dr. Luan Berisha",
    role: { en: "Surgeon", sq: "Kirurg", de: "Chirurg" },
    city: "Gjakove",
    content: {
      en: "I needed a quiet, private villa away from the city noise. The team at MADEM listened carefully to my requirements and found the perfect property. I couldn't be happier with their service.",
      sq: "Më duhej një vilë e qetë dhe private larg zhurmës së qytetit. Ekipi i MADEM i dëgjoi me kujdes kërkesat e mia dhe gjeti pronën e përsosur. Nuk mund të isha më i kënaqur me shërbimin e tyre.",
      de: "Ich brauchte eine ruhige, private Villa abseits des Stadtlärms. Das Team von MADEM hörte sich meine Anforderungen aufmerksam an und fand die perfekte Immobilie. Mit ihrem Service könnte ich nicht zufriedener sein.",
    },
    rating: 5,
    image: "https://picsum.photos/seed/test8/200/200",
  },
];

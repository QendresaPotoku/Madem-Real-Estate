import type { Localized } from "@/i18n/types";

export interface BlogPost {
  id: string;
  title: Localized;
  category: string;
  excerpt: Localized;
  content: Localized;
  image: string;
  author: string;
  publishedAt: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "b1",
    title: {
      en: "The Rise of Luxury Real Estate in Prishtina",
      sq: "Ngritja e patundshmërive luksoze në Prishtinë",
      de: "Der Aufstieg von Luxusimmobilien in Prishtina",
    },
    category: "Market Trends",
    excerpt: {
      en: "Exploring the growing demand for high-end properties in Kosovo's capital and what it means for investors.",
      sq: "Eksplorimi i kërkesës në rritje për prona ekskluzive në kryeqytetin e Kosovës dhe çfarë do të thotë kjo për investitorët.",
      de: "Eine Untersuchung der wachsenden Nachfrage nach hochwertigen Immobilien in der Hauptstadt des Kosovo und was das für Investoren bedeutet.",
    },
    content: {
      en: "Prishtina's skyline is rapidly changing. Over the past five years, we've seen a significant shift towards luxury developments, catering to both affluent locals and the diaspora. The demand for penthouses, smart homes, and gated communities has outpaced supply, leading to premium valuations in sought-after neighborhoods like Dragodan and Taslixhe.\n\nInvestors are recognizing the potential for high ROI, particularly in properties offering exclusive amenities such as private pools, 24/7 security, and concierge services. As the city continues to modernize, the luxury sector is expected to remain a driving force in the Kosovo real estate market.",
      sq: "Silueta e Prishtinës po ndryshon me shpejtësi. Gjatë pesë viteve të fundit kemi parë një zhvendosje të ndjeshme drejt zhvillimeve luksoze, që u shërbejnë si vendasve të pasur ashtu edhe diasporës. Kërkesa për penthouse, shtëpi inteligjente dhe komplekse të mbyllura e ka tejkaluar ofertën, duke çuar në vlerësime premium në lagjet e kërkuara si Dragodani dhe Tasllëxhja.\n\nInvestitorët po e kuptojnë potencialin për kthim të lartë të investimit, veçanërisht te pronat që ofrojnë komoditete ekskluzive si pishina private, siguri 24/7 dhe shërbime concierge. Ndërsa qyteti vazhdon të modernizohet, pritet që sektori i luksit të mbetet një forcë lëvizëse në tregun e patundshmërive në Kosovë.",
      de: "Die Skyline von Prishtina verändert sich rasant. In den letzten fünf Jahren haben wir eine deutliche Verschiebung hin zu Luxusprojekten beobachtet, die sowohl wohlhabende Einheimische als auch die Diaspora ansprechen. Die Nachfrage nach Penthäusern, Smart Homes und geschlossenen Wohnanlagen hat das Angebot übertroffen, was zu Premium-Bewertungen in begehrten Vierteln wie Dragodan und Taslixhe führt.\n\nInvestoren erkennen das Potenzial für eine hohe Rendite, insbesondere bei Immobilien mit exklusiven Annehmlichkeiten wie Privatpools, Sicherheit rund um die Uhr und Concierge-Service. Während sich die Stadt weiter modernisiert, dürfte der Luxussektor eine treibende Kraft auf dem kosovarischen Immobilienmarkt bleiben.",
    },
    image: "https://picsum.photos/seed/blog1/800/500",
    author: "Dardan Krasniqi",
    publishedAt: "2023-10-15T09:00:00Z",
  },
  {
    id: "b2",
    title: {
      en: "Guide to Buying Property as a Non-Resident",
      sq: "Udhëzues për blerjen e pronës si jorezident",
      de: "Leitfaden zum Immobilienkauf als Nicht-Ansässiger",
    },
    category: "Buying Guide",
    excerpt: {
      en: "Everything you need to know about purchasing real estate in Kosovo if you live abroad.",
      sq: "Gjithçka që duhet të dini për blerjen e patundshmërive në Kosovë nëse jetoni jashtë vendit.",
      de: "Alles, was Sie über den Immobilienkauf im Kosovo wissen müssen, wenn Sie im Ausland leben.",
    },
    content: {
      en: "Purchasing property in Kosovo from abroad is more straightforward than many anticipate, but it requires careful navigation of the legal landscape. The primary step involves securing a local representative through a Power of Attorney (PoA), allowing them to handle the bureaucratic processes on your behalf.\n\nKey considerations include understanding the municipal property taxes, the property registration process at the Cadastral Agency, and the implications of the Law on Foreign Investment. Working with a reputable agency like MADEM ensures that all legalities, from drafting the pre-contract to the final deed transfer at the notary, are handled smoothly and securely.",
      sq: "Blerja e pronës në Kosovë nga jashtë vendit është më e thjeshtë se sa mendojnë shumë, por kërkon lundrim të kujdesshëm nëpër peizazhin ligjor. Hapi kryesor përfshin sigurimin e një përfaqësuesi vendor përmes një Autorizimi (Prokure), duke i lejuar atij të kujdeset për proceset burokratike në emrin tuaj.\n\nKonsideratat kryesore përfshijnë kuptimin e tatimit komunal në pronë, procesin e regjistrimit të pronës në Agjencinë Kadastrale dhe implikimet e Ligjit për Investimet e Huaja. Bashkëpunimi me një agjenci të besueshme si MADEM siguron që të gjitha çështjet ligjore, nga hartimi i parakontratës deri te bartja përfundimtare e pronësisë te noteri, të trajtohen pa probleme dhe me siguri.",
      de: "Der Kauf einer Immobilie im Kosovo aus dem Ausland ist unkomplizierter, als viele erwarten, erfordert jedoch ein sorgfältiges Navigieren durch die rechtlichen Rahmenbedingungen. Der erste Schritt besteht darin, über eine Vollmacht einen lokalen Vertreter zu bestellen, der die bürokratischen Vorgänge in Ihrem Namen erledigt.\n\nZu den wichtigsten Aspekten gehören das Verständnis der kommunalen Grundsteuern, des Eintragungsverfahrens bei der Katasteragentur und der Auswirkungen des Gesetzes über ausländische Investitionen. Die Zusammenarbeit mit einer renommierten Agentur wie MADEM stellt sicher, dass alle rechtlichen Angelegenheiten – vom Entwurf des Vorvertrags bis zur endgültigen Eigentumsübertragung beim Notar – reibungslos und sicher abgewickelt werden.",
    },
    image: "https://picsum.photos/seed/blog2/800/500",
    author: "Liridon Gashi",
    publishedAt: "2023-09-28T10:30:00Z",
  },
  {
    id: "b3",
    title: {
      en: "Maximizing Your Rental Yield in City Centers",
      sq: "Maksimizimi i të ardhurave nga qiraja në qendrat e qyteteve",
      de: "Maximierung Ihrer Mietrendite in Stadtzentren",
    },
    category: "Investment",
    excerpt: {
      en: "Strategic tips for property owners looking to increase their rental income in urban areas.",
      sq: "Këshilla strategjike për pronarët që duan të rrisin të ardhurat nga qiraja në zonat urbane.",
      de: "Strategische Tipps für Eigentümer, die ihre Mieteinnahmen in städtischen Gebieten steigern möchten.",
    },
    content: {
      en: "Urban centers in Kosovo, particularly Prishtina and Prizren, offer excellent opportunities for rental yields, provided the property is positioned correctly. The key to maximizing returns lies in targeting the right demographic—often expats, diplomats, or young professionals.\n\nTo achieve premium rental rates, properties must offer more than just a good location. High-speed internet, modern furnishings, energy-efficient heating (like heat pumps), and dedicated parking are non-negotiable for high-end tenants. Additionally, considering short-term rentals vs. long-term leases can significantly impact your annual ROI, depending on the property's proximity to business districts or tourist attractions.",
      sq: "Qendrat urbane në Kosovë, veçanërisht Prishtina dhe Prizreni, ofrojnë mundësi të shkëlqyera për të ardhura nga qiraja, me kusht që prona të jetë e pozicionuar si duhet. Çelësi për maksimizimin e kthimeve qëndron në synimin e demografisë së duhur—shpesh të huaj, diplomatë ose profesionistë të rinj.\n\nPër të arritur çmime premium qiraje, pronat duhet të ofrojnë më shumë se thjesht një lokacion të mirë. Interneti me shpejtësi të lartë, mobiliet moderne, ngrohja efikase (si pompat termike) dhe parkingu i dedikuar janë të domosdoshme për qiramarrësit ekskluzivë. Përveç kësaj, marrja parasysh e qirave afatshkurtra kundrejt atyre afatgjata mund të ndikojë ndjeshëm në kthimin tuaj vjetor, varësisht nga afërsia e pronës me zonat e biznesit ose atraksionet turistike.",
      de: "Städtische Zentren im Kosovo, insbesondere Prishtina und Prizren, bieten hervorragende Möglichkeiten für Mietrenditen, sofern die Immobilie richtig positioniert ist. Der Schlüssel zur Maximierung der Erträge liegt darin, die richtige Zielgruppe anzusprechen – häufig Expats, Diplomaten oder junge Berufstätige.\n\nUm Premium-Mietpreise zu erzielen, müssen Immobilien mehr als nur eine gute Lage bieten. Schnelles Internet, moderne Einrichtung, energieeffiziente Heizung (wie Wärmepumpen) und ein eigener Parkplatz sind für anspruchsvolle Mieter unverzichtbar. Außerdem kann die Abwägung zwischen Kurzzeit- und Langzeitvermietung Ihre jährliche Rendite erheblich beeinflussen, je nach Nähe der Immobilie zu Geschäftsvierteln oder Touristenattraktionen.",
    },
    image: "https://picsum.photos/seed/blog3/800/500",
    author: "Teuta Rexhepi",
    publishedAt: "2023-09-10T14:15:00Z",
  },
  {
    id: "b4",
    title: {
      en: "Architectural Heritage: Restoring Prizren's Stone Houses",
      sq: "Trashëgimia arkitekturore: Restaurimi i shtëpive të gurit në Prizren",
      de: "Architektonisches Erbe: Die Restaurierung der Steinhäuser von Prizren",
    },
    category: "Architecture",
    excerpt: {
      en: "The value of preserving historic properties and integrating modern luxuries.",
      sq: "Vlera e ruajtjes së pronave historike dhe integrimi i komoditeteve moderne.",
      de: "Der Wert der Erhaltung historischer Immobilien und der Integration moderner Annehmlichkeiten.",
    },
    content: {
      en: "Prizren, known as the cultural capital of Kosovo, holds immense architectural wealth in its historic stone houses. Restoring these properties is a delicate balance between preserving their cultural heritage and introducing modern comforts expected in premium real estate.\n\nSuccessful restorations maintain original features such as exposed wooden beams, stone masonry, and traditional courtyards, while discreetly integrating underfloor heating, smart home technology, and contemporary kitchen designs. These properties hold a unique market position, appealing to buyers who value history and exclusivity over generic modern builds.",
      sq: "Prizreni, i njohur si kryeqyteti kulturor i Kosovës, mban një pasuri të jashtëzakonshme arkitekturore në shtëpitë e tij historike prej guri. Restaurimi i këtyre pronave është një ekuilibër delikat midis ruajtjes së trashëgimisë së tyre kulturore dhe futjes së komoditeteve moderne që priten te patundshmëritë premium.\n\nRestaurimet e suksesshme ruajnë veçoritë origjinale si trarët e dukshëm prej druri, muraturën prej guri dhe oborret tradicionale, ndërkohë që integrojnë me diskrecion ngrohjen nën dysheme, teknologjinë e shtëpisë inteligjente dhe dizajnet bashkëkohore të kuzhinës. Këto prona kanë një pozitë unike në treg, duke tërhequr blerës që e vlerësojnë historinë dhe ekskluzivitetin mbi ndërtimet moderne të zakonshme.",
      de: "Prizren, bekannt als die Kulturhauptstadt des Kosovo, birgt in seinen historischen Steinhäusern einen immensen architektonischen Reichtum. Die Restaurierung dieser Immobilien ist eine heikle Balance zwischen der Bewahrung ihres kulturellen Erbes und der Einführung des modernen Komforts, den man bei Premium-Immobilien erwartet.\n\nErfolgreiche Restaurierungen erhalten Originalmerkmale wie sichtbare Holzbalken, Steinmauerwerk und traditionelle Innenhöfe und integrieren zugleich dezent Fußbodenheizung, Smart-Home-Technologie und zeitgemäße Küchengestaltung. Diese Immobilien nehmen eine einzigartige Marktposition ein und sprechen Käufer an, die Geschichte und Exklusivität gegenüber gewöhnlichen modernen Bauten schätzen.",
    },
    image: "https://picsum.photos/seed/blog4/800/500",
    author: "Blerta Kelmendi",
    publishedAt: "2023-08-22T11:00:00Z",
  },
  {
    id: "b5",
    title: {
      en: "Commercial Real Estate: Where to Invest Next",
      sq: "Patundshmëritë komerciale: Ku të investoni më pas",
      de: "Gewerbeimmobilien: Wo Sie als Nächstes investieren sollten",
    },
    category: "Commercial",
    excerpt: {
      en: "An analysis of the top commercial zones developing across the country.",
      sq: "Një analizë e zonave kryesore komerciale që po zhvillohen në mbarë vendin.",
      de: "Eine Analyse der wichtigsten Gewerbegebiete, die sich im ganzen Land entwickeln.",
    },
    content: {
      en: "The commercial real estate landscape in Kosovo is diversifying beyond the traditional city centers. Industrial zones on the outskirts of major cities, particularly along the Prishtina-Ferizaj highway, are seeing massive investments in logistics and warehousing.\n\nFor investors, the shift towards e-commerce and local manufacturing necessitates modern warehousing facilities with high clearance, robust security, and excellent transport links. Retail parks are also gaining traction, offering a different investment profile compared to traditional high-street retail, focusing on convenience and ample parking.",
      sq: "Peizazhi i patundshmërive komerciale në Kosovë po diversifikohet përtej qendrave tradicionale të qyteteve. Zonat industriale në periferi të qyteteve të mëdha, veçanërisht përgjatë autostradës Prishtinë-Ferizaj, po shohin investime masive në logjistikë dhe magazinim.\n\nPër investitorët, zhvendosja drejt tregtisë elektronike dhe prodhimit vendor kërkon objekte moderne magazinimi me lartësi të madhe, siguri të fortë dhe lidhje të shkëlqyera transporti. Parqet tregtare po marrin gjithashtu vrull, duke ofruar një profil të ndryshëm investimi krahasuar me tregtinë tradicionale të rrugës kryesore, me fokus te komoditeti dhe parkingu i bollshëm.",
      de: "Die Landschaft der Gewerbeimmobilien im Kosovo diversifiziert sich über die traditionellen Stadtzentren hinaus. In Industriegebieten am Rande größerer Städte, insbesondere entlang der Autobahn Prishtina–Ferizaj, sind massive Investitionen in Logistik und Lagerhaltung zu beobachten.\n\nFür Investoren erfordert der Trend zu E-Commerce und lokaler Produktion moderne Lagereinrichtungen mit großer Höhe, robuster Sicherheit und hervorragender Verkehrsanbindung. Auch Fachmarktzentren gewinnen an Bedeutung und bieten ein anderes Investitionsprofil als der traditionelle Einzelhandel in Innenstadtlagen, mit Schwerpunkt auf Bequemlichkeit und reichlich Parkplätzen.",
    },
    image: "https://picsum.photos/seed/blog5/800/500",
    author: "Valon Berisha",
    publishedAt: "2023-08-05T08:45:00Z",
  },
  {
    id: "b6",
    title: {
      en: "The Importance of Staging Before Selling",
      sq: "Rëndësia e prezantimit (staging) para shitjes",
      de: "Die Bedeutung des Home Staging vor dem Verkauf",
    },
    category: "Selling Guide",
    excerpt: {
      en: "How professional staging can increase your property's value and reduce time on market.",
      sq: "Si mund ta rrisë prezantimi profesional vlerën e pronës suaj dhe ta shkurtojë kohën në treg.",
      de: "Wie professionelles Home Staging den Wert Ihrer Immobilie steigern und die Vermarktungszeit verkürzen kann.",
    },
    content: {
      en: "First impressions are critical in real estate. Professional staging transforms a property from a mere living space into a lifestyle aspiration, allowing potential buyers to envision themselves in the home.\n\nStaging involves decluttering, optimizing furniture layout, and utilizing neutral color palettes to highlight the property's best features. In the luxury market, this might mean bringing in contemporary art pieces or high-end furniture rentals. Properties that are professionally staged consistently sell faster and closer to their asking price compared to vacant or poorly presented homes.",
      sq: "Përshtypjet e para janë vendimtare në patundshmëri. Prezantimi profesional e shndërron një pronë nga thjesht një hapësirë banimi në një aspiratë stili jetese, duke u lejuar blerësve potencialë ta imagjinojnë veten në shtëpi.\n\nPrezantimi përfshin heqjen e gjërave të tepërta, optimizimin e vendosjes së mobilieve dhe përdorimin e paletave neutrale të ngjyrave për të theksuar veçoritë më të mira të pronës. Në tregun e luksit, kjo mund të nënkuptojë sjelljen e veprave të artit bashkëkohor ose marrjen me qira të mobilieve ekskluzive. Pronat e prezantuara në mënyrë profesionale shiten vazhdimisht më shpejt dhe më afër çmimit të kërkuar krahasuar me shtëpitë e zbrazëta ose të prezantuara dobët.",
      de: "Der erste Eindruck ist bei Immobilien entscheidend. Professionelles Home Staging verwandelt eine Immobilie von einem bloßen Wohnraum in ein Lebensgefühl und ermöglicht es potenziellen Käufern, sich selbst im Haus vorzustellen.\n\nStaging umfasst das Entrümpeln, die Optimierung der Möbelanordnung und die Verwendung neutraler Farbpaletten, um die besten Eigenschaften der Immobilie hervorzuheben. Im Luxussegment kann dies bedeuten, zeitgenössische Kunstwerke einzubringen oder hochwertige Möbel zu mieten. Professionell inszenierte Immobilien verkaufen sich durchweg schneller und näher am geforderten Preis als leere oder schlecht präsentierte Häuser.",
    },
    image: "https://picsum.photos/seed/blog6/800/500",
    author: "Arbenita Hoxha",
    publishedAt: "2023-07-18T13:20:00Z",
  },
  {
    id: "b7",
    title: {
      en: "Understanding Property Valuations in 2023",
      sq: "Të kuptojmë vlerësimet e pronave në vitin 2023",
      de: "Immobilienbewertungen im Jahr 2023 verstehen",
    },
    category: "Market Trends",
    excerpt: {
      en: "A deep dive into the factors driving property prices in the current economic climate.",
      sq: "Një vështrim i thelluar mbi faktorët që nxisin çmimet e pronave në klimën aktuale ekonomike.",
      de: "Ein tiefer Einblick in die Faktoren, die die Immobilienpreise im aktuellen Wirtschaftsklima bestimmen.",
    },
    content: {
      en: "Property valuations in Kosovo are influenced by a complex interplay of local demand, diaspora investment, and broader economic factors such as inflation and construction material costs. In 2023, we've seen a stabilization of prices following the post-pandemic surge.\n\nLocation remains the paramount factor, but energy efficiency and building quality are increasingly dictating premium valuations. Buyers are more educated and demand transparency regarding construction standards, insulation quality, and legal documentation. Properties that meet these stringent criteria hold their value exceptionally well.",
      sq: "Vlerësimet e pronave në Kosovë ndikohen nga një ndërveprim kompleks i kërkesës vendore, investimeve të diasporës dhe faktorëve më të gjerë ekonomikë si inflacioni dhe kostot e materialeve të ndërtimit. Në vitin 2023 kemi parë një stabilizim të çmimeve pas rritjes së menjëhershme paspandemike.\n\nLokacioni mbetet faktori më i rëndësishëm, por efikasiteti energjetik dhe cilësia e ndërtimit gjithnjë e më shumë po diktojnë vlerësime premium. Blerësit janë më të informuar dhe kërkojnë transparencë lidhur me standardet e ndërtimit, cilësinë e izolimit dhe dokumentacionin ligjor. Pronat që i plotësojnë këto kritere të rrepta e ruajnë vlerën e tyre jashtëzakonisht mirë.",
      de: "Immobilienbewertungen im Kosovo werden durch ein komplexes Zusammenspiel aus lokaler Nachfrage, Investitionen der Diaspora und allgemeineren wirtschaftlichen Faktoren wie Inflation und Baukosten beeinflusst. Im Jahr 2023 haben wir nach dem Anstieg nach der Pandemie eine Stabilisierung der Preise beobachtet.\n\nDie Lage bleibt der wichtigste Faktor, doch Energieeffizienz und Bauqualität bestimmen zunehmend Premium-Bewertungen. Käufer sind besser informiert und verlangen Transparenz hinsichtlich Baustandards, Dämmqualität und rechtlicher Dokumentation. Immobilien, die diese strengen Kriterien erfüllen, behalten ihren Wert außergewöhnlich gut.",
    },
    image: "https://picsum.photos/seed/blog7/800/500",
    author: "Liridon Gashi",
    publishedAt: "2023-07-02T10:00:00Z",
  },
  {
    id: "b8",
    title: {
      en: "Top 5 Neighborhoods for Families in Prishtina",
      sq: "5 lagjet më të mira për familje në Prishtinë",
      de: "Die 5 besten Viertel für Familien in Prishtina",
    },
    category: "Lifestyle",
    excerpt: {
      en: "Discover the best areas offering safety, green spaces, and community amenities.",
      sq: "Zbuloni zonat më të mira që ofrojnë siguri, hapësira të gjelbra dhe lehtësira komunitare.",
      de: "Entdecken Sie die besten Gegenden mit Sicherheit, Grünflächen und gemeinschaftlichen Annehmlichkeiten.",
    },
    content: {
      en: "For families relocating to or within Prishtina, choosing the right neighborhood involves balancing commute times with access to schools, parks, and safety. Neighborhoods like Veternik and Sofalia are highly sought after for their spacious villas, lower density, and proximity to international schools.\n\nUlpiana and Dardania offer excellent urban family living, with established parks, walking paths, and immediate access to city services. The development of new gated communities on the city's periphery is also attracting families seeking secure environments with integrated amenities like playgrounds and community centers.",
      sq: "Për familjet që zhvendosen drejt ose brenda Prishtinës, zgjedhja e lagjes së duhur kërkon balancimin e kohës së udhëtimit me qasjen në shkolla, parqe dhe sigurinë. Lagjet si Veterniku dhe Sofalia janë shumë të kërkuara për vilat e tyre të gjera, dendësinë më të ulët dhe afërsinë me shkollat ndërkombëtare.\n\nUlpiana dhe Dardania ofrojnë jetesë të shkëlqyer urbane familjare, me parqe të konsoliduara, shtigje për ecje dhe qasje të menjëhershme në shërbimet e qytetit. Zhvillimi i komplekseve të reja të mbyllura në periferi të qytetit po tërheq gjithashtu familje që kërkojnë mjedise të sigurta me lehtësira të integruara si kënde lojërash dhe qendra komunitare.",
      de: "Für Familien, die nach oder innerhalb von Prishtina umziehen, bedeutet die Wahl des richtigen Viertels, die Pendelzeiten mit dem Zugang zu Schulen, Parks und Sicherheit in Einklang zu bringen. Viertel wie Veternik und Sofalia sind wegen ihrer geräumigen Villen, der geringeren Bebauungsdichte und der Nähe zu internationalen Schulen sehr begehrt.\n\nUlpiana und Dardania bieten hervorragendes urbanes Familienleben mit etablierten Parks, Spazierwegen und unmittelbarem Zugang zu städtischen Dienstleistungen. Auch die Entwicklung neuer geschlossener Wohnanlagen am Stadtrand zieht Familien an, die sichere Umgebungen mit integrierten Annehmlichkeiten wie Spielplätzen und Gemeinschaftszentren suchen.",
    },
    image: "https://picsum.photos/seed/blog8/800/500",
    author: "Blerta Kelmendi",
    publishedAt: "2023-06-20T09:30:00Z",
  },
];

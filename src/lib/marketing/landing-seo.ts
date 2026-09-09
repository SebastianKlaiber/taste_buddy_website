type Locale = 'en' | 'de';

export const landingFaqs = {
  en: [
    { question: 'What is TasteBuddy?', answer: 'TasteBuddy is a recipe organizer app for iPhone, Android, and the web. Collect recipes from social media, websites, screenshots, handwritten cards, and notes in a searchable digital cookbook, then use them for meal planning, shopping lists, and step-by-step cooking.' },
    { question: 'How do I save recipes from TikTok and Instagram?', answer: 'Share the recipe link with TasteBuddy or paste it into the app. TasteBuddy can extract available recipe information into ingredients and instructions. Results depend on the source: private posts, inaccessible links, or videos without recipe details may need a screenshot or manual additions. Review the imported recipe before cooking.' },
    { question: 'Can I collect recipes from websites and screenshots?', answer: 'Yes. Import a recipe link from a food blog or website, or add a screenshot, photographed recipe card, or note. Keep these recipes together instead of searching through browser bookmarks and your photo library.' },
    { question: 'Can I make a meal plan and shopping list from my recipes?', answer: 'Yes. Choose saved recipes for your meal plan and add their ingredients to a shopping list. Open the recipe when you are ready to cook and follow its preparation steps.' },
    { question: 'Where can I use TasteBuddy?', answer: 'TasteBuddy is available for iPhone and Android, with a web app for your browser. Use the App Store or Google Play links on this page to download it, or choose Open Web App.' },
  ],
  de: [
    { question: 'Was ist TasteBuddy?', answer: 'TasteBuddy ist eine Rezept-App für iPhone, Android und den Browser. Sammle Rezepte aus Social Media, Websites, Screenshots, handgeschriebenen Rezeptkarten und Notizen in einem durchsuchbaren digitalen Kochbuch. Erstelle daraus einen Wochenplan und eine Einkaufsliste und koche Schritt für Schritt.' },
    { question: 'Wie kann ich TikTok-Rezepte und Instagram-Rezepte speichern?', answer: 'Teile den Rezept-Link mit TasteBuddy oder füge ihn in der App ein. TasteBuddy übernimmt verfügbare Rezeptinformationen als Zutaten und Zubereitungsschritte. Bei privaten Beiträgen, nicht erreichbaren Links oder Videos ohne Rezeptangaben kann ein Screenshot oder eine manuelle Ergänzung nötig sein. Prüfe das importierte Rezept vor dem Kochen.' },
    { question: 'Kann ich Rezepte von Websites und aus Screenshots sammeln?', answer: 'Ja. Importiere einen Rezept-Link von einem Foodblog oder einer Website oder füge einen Screenshot, eine fotografierte Rezeptkarte oder eine Notiz hinzu. So findest du deine Rezepte an einem Ort statt in Lesezeichen und deiner Fotogalerie.' },
    { question: 'Kann ich aus meinen Rezepten einen Wochenplan und eine Einkaufsliste erstellen?', answer: 'Ja. Wähle gespeicherte Rezepte für deinen Wochenplan und übernimm ihre Zutaten in eine Einkaufsliste. Zum Kochen öffnest du das Rezept und folgst den Zubereitungsschritten.' },
    { question: 'Auf welchen Geräten kann ich TasteBuddy nutzen?', answer: 'TasteBuddy gibt es für iPhone und Android sowie als Web-App im Browser. Lade die App über den App Store oder Google Play herunter oder wähle auf dieser Seite Web-App öffnen.' },
  ],
} satisfies Record<Locale, { question: string; answer: string }[]>;

export function getLandingPageSchema(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': 'https://taste-buddy.app/#app',
    name: 'TasteBuddy',
    url: locale === 'de' ? 'https://taste-buddy.app/de/' : 'https://taste-buddy.app/',
    description,
    inLanguage: locale,
    operatingSystem: 'iOS, Android, Web',
    applicationCategory: 'LifestyleApplication',
    applicationSubCategory: 'Food & Drink',
    image: 'https://taste-buddy.app/Icon.png',
    featureList: locale === 'de'
      ? ['Rezepte importieren und sammeln', 'Durchsuchbares digitales Kochbuch', 'Wochenplan', 'Einkaufsliste', 'Schritt-für-Schritt-Kochansicht']
      : ['Recipe import and collection', 'Searchable digital cookbook', 'Meal planning', 'Shopping lists', 'Step-by-step cooking'],
    downloadUrl: [
      'https://apps.apple.com/app/id6554007741',
      'https://play.google.com/store/apps/details?id=app.tastebuddy',
    ],
    publisher: { '@type': 'Organization', name: 'TasteBuddy', url: 'https://taste-buddy.app/' },
  };
}

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        
        {}
        <Link href="/" className="text-2xl font-bold text-indigo-700 hover:text-indigo-900 transition duration-150">
          SportSondage
        </Link>
        
        {}
        <nav className="flex space-x-6">
          <Link href="/" className="text-gray-600 hover:text-indigo-600 font-medium">
            Accueil
          </Link>
          <Link href="/survey" className="text-gray-600 hover:text-indigo-600 font-medium">
            Sondage
          </Link>
          <Link href="/results" className="text-gray-600 hover:text-indigo-600 font-medium">
            Résultats
          </Link>
        </nav>
      </div>
    </header>
  );
}
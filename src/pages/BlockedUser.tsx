import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ShieldOff, MessageCircle } from "lucide-react";

const BlockedUser = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-slate-950 dark:via-red-950 dark:to-rose-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      <Header />

      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <div className="text-center glass-morphism p-8 rounded-xl max-w-md w-full">
          <div className="flex justify-center mb-6 text-red-500 dark:text-red-400">
            <ShieldOff className="w-14 h-14" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">Akun Diblokir</h1>
          <p className="text-lg text-muted-foreground mb-3">
            Akun anda telah di blokir.
          </p>
          <p className="text-muted-foreground mb-8">
            Silahkan hubungi admin jika menurut anda tindakan ini harusnya tidak terjadi.
          </p>
          <a
            href="https://wa.me/6287777694482"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center w-full"
          >
            <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg w-full uppercase tracking-wide">
              <MessageCircle className="w-5 h-5 mr-2" aria-hidden="true" />
              Lapor ke Admin
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlockedUser;

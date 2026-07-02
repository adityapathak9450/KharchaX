import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { VaultLogo } from "../components/auth/VaultLogo";
import heroBg from "../assets/hero-card2.png";

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden text-white bg-cover bg-center bg-no-repeat "
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(0,0,0,0.15),
            rgba(0,0,0,0.25)
          ),
          url(${heroBg})
        `,backgroundPosition: "right center",
      }}
    >
      {/* Optional dark overlay */}
      <div className="absolute inset-0 bg-black/10 " />


      <div className="relative z-10 mx-auto flex min-h-screen max-w-8xl flex-col px-6 pb-16 pt-8 sm:px-10">
        {/* Navbar */}
<header className="flex items-center justify-between">
  <Link to="/" className="flex items-center gap-3">
    <VaultLogo className="h-9 w-9" />

    <span className="text-3xl font-bold tracking-tight text-white">
      KharchaX
    </span>
  </Link>

  <div className="flex items-center gap-8">
    <Link
      to="/login"
      className="
        text-md
        font-small
        text-gray-300
        transition-colors
        hover:text-white
      "
    >
      Sign In
    </Link>

    <Link
      to="/register"
      className="
        rounded-lg
        bg-indigo-900
        px-3
        py-1
        text-sm
        font-medium
        text-white
        transition-all
        hover:bg-indigo-800
      "
    >
      Get Started
    </Link>
  </div>
</header>
  <div className="mt-4 h-px w-full bg-white/30" />

        {/* Hero Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            flex flex-1
            flex-col
            items-start
            justify-center
            pl-2
            sm:pl-6
            lg:pl-10
          "
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            Finance OS
          </p>

          <h1
            className="
              mt-4
              max-w-2xl
              text-5xl
              font-bold
              leading-[1.05]
              tracking-tight
              sm:text-6xl
              lg:text-7xl
            "
            style={{
              textShadow: "0 4px 30px rgba(0,0,0,0.6)",
            }}
          >
            Take Control Of
            <span className="block text-white/50">
              Every Rupee
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg">
            Track expenses, manage budgets and gain complete
            visibility over your finances with KharchaX.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="
                rounded-xl
                bg-indigo-600
                px-6
                py-3
                text-sm
                font-medium
                text-black
                transition-all
                hover:bg-indigo-500
              "
            >
              Create Free Account
            </Link>

            <Link
              to="/login"
              className="
                rounded-xl
                border
                border-white/15
                bg-white/5
                px-6
                py-3
                text-sm
                font-medium
                text-white
                backdrop-blur-md
                transition-all
                hover:bg-white/10
              "
            >
              Sign In
            </Link>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
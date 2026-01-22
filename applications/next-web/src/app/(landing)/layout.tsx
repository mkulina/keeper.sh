import type { FC, PropsWithChildren } from "react";
import { Header } from "@/compositions/header/header";
import { Footer } from "@/compositions/footer/footer";

const LandingLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Header />
      <main>
        {children}
      </main>
      <Footer />
    </>
  )
}

export default LandingLayout;

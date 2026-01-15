import type { PropsWithChildren, ReactNode } from "react";
import { Header } from "@/components/header";

const AuthLayout = ({ children }: PropsWithChildren): ReactNode => (
  <div className="flex flex-col flex-1">
    <Header />
    {children}
  </div>
);

export default AuthLayout;

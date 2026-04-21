import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/launcher/Layout";
import { ModrinthBrowser } from "@/components/launcher/ModrinthBrowser";

const Library = () => {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  return (
    <Layout>
      <ModrinthBrowser
        projectType="mod"
        title="Каталог модов"
        subtitle="Тысячи модов для Fabric, Forge, NeoForge, Quilt — прямо из Modrinth."
        initialQuery={initialQ}
      />
    </Layout>
  );
};

export default Library;

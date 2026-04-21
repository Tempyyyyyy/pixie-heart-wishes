import { Layout } from "@/components/launcher/Layout";
import { ModrinthBrowser } from "@/components/launcher/ModrinthBrowser";

const Modpacks = () => (
  <Layout>
    <ModrinthBrowser
      projectType="modpack"
      title="Сборки (modpacks)"
      subtitle="Готовые наборы модов от сообщества: технические, магические, приключенческие."
    />
  </Layout>
);

export default Modpacks;

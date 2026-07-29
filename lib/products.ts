export type ProductStatus = "available" | "custom";

export type Variant = {
  name: string;
  note?: string;
  /**
   * Valor de referência em R$ para montagem da vitrine.
   * Não deve ser usado como cobrança real sem validação comercial.
   */
  priceBRL?: number;
  badge?: string;
};

export type Product = {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  image: string;
  status: ProductStatus;
  variants: Variant[];
  /** ID do vídeo do YouTube (o trecho depois de `v=`), quando disponível. */
  youtubeId?: string;
  videoOrientation?: "landscape" | "portrait";
};

export const products: Product[] = [
  {
    "slug": "dayz-priv8-software",
    "title": "DayZ (Priv8 Software)",
    "category": "DayZ",
    "tagline": "DayZ (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/performance-audit-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 30.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 66.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 173.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "dayz-dupper",
    "title": "DayZ Dupper",
    "category": "DayZ",
    "tagline": "DayZ Dupper Acesso",
    "description": "Duplication loot in DAYZ.\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/game-setup-pro-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 15.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 25.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 50.99
      }
    ],
    "youtubeId": "_2cS7WUqKM4"
  },
  {
    "slug": "dead-by-daylight-priv8-software",
    "title": "Dead by Daylight (Priv8 Software)",
    "category": "Dead by Daylight",
    "tagline": "Dead by Daylight (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 20.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 61.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 137.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "deadlock-priv8-software",
    "title": "Deadlock (Priv8 Software)",
    "category": "Deadlock",
    "tagline": "Deadlock (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/creator-identity-pack-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "30 Dias",
        "priceBRL": 91.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "delta-force-priv8-software",
    "title": "Delta Force (Priv8 Software)",
    "category": "Delta Force",
    "tagline": "Delta Force (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/steam-profile-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "7 Dias",
        "priceBRL": 152.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 203.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "escape-from-tarkov-priv8-software",
    "title": "Escape From Tarkov (Priv8 Software)",
    "category": "Escape From Tarkov",
    "tagline": "Escape From Tarkov (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/reshades-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "7 Dias",
        "priceBRL": 101.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 203.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "farlight-84-priv8-software",
    "title": "Farlight 84 (Priv8 Software)",
    "category": "Farlight 84",
    "tagline": "Farlight 84 (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/stream-studio-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 10.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 30.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 81.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "fivem-priv8-software",
    "title": "FiveM (Priv8 Software)",
    "category": "FiveM",
    "tagline": "FiveM (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/performance-audit-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 10.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 30.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 86.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "fortnite-priv8-software",
    "title": "Fortnite (Priv8 Software)",
    "category": "Fortnite",
    "tagline": "Fortnite (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Não suportado\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/game-setup-pro-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 35.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 107.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 202.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "freezing",
    "title": "Freezing",
    "category": "Utilitário de gameplay",
    "tagline": "Freezing Acesso",
    "description": "Freezing players to kill.\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "hell-let-loose-priv8-software",
    "title": "Hell Let Loose (Priv8 Software)",
    "category": "Hell Let Loose",
    "tagline": "Hell Let Loose (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/creator-identity-pack-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 10.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 30.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 81.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "marvel-rivals-priv8-software",
    "title": "Marvel Rivals (Priv8 Software)",
    "category": "Marvel Rivals",
    "tagline": "Marvel Rivals (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/steam-profile-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 10.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 25.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 71.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "meccha-chameleon-priv8-software",
    "title": "Meccha Chameleon (Priv8 Software)",
    "category": "Meccha Chameleon",
    "tagline": "Meccha Chameleon (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/reshades-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "30 Dias",
        "priceBRL": 61.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "overwatch-2-priv8-software",
    "title": "Overwatch 2 (Priv8 Software)",
    "category": "Overwatch 2",
    "tagline": "Overwatch 2 (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/stream-studio-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 10.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 31.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 87.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "point-blank-priv8-software",
    "title": "Point Blank (Priv8 Software)",
    "category": "Point Blank",
    "tagline": "Point Blank (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/performance-audit-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "7 Dias",
        "priceBRL": 30.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 81.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "pubg-priv8-software",
    "title": "PUBG (Priv8 Software)",
    "category": "PUBG",
    "tagline": "PUBG (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Apenas Windows 11\nModo de...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/game-setup-pro-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 46.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 134.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 252.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "recoil-ia",
    "title": "Recoil \\[IA\\]",
    "category": "Geral",
    "tagline": "Recoil \\[IA\\] Acesso",
    "description": "Full control recoil.\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "redm-priv8-software",
    "title": "RedM (Priv8 Software)",
    "category": "RedM",
    "tagline": "RedM (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/creator-identity-pack-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "30 Dias",
        "priceBRL": 132.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "roblox-priv8-software",
    "title": "Roblox (Priv8 Software)",
    "category": "Roblox",
    "tagline": "Roblox (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/steam-profile-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 11.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 31.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 88.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "rust-priv8-software",
    "title": "Rust (Priv8 Software)",
    "category": "Rust",
    "tagline": "Rust (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Não suportado\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/reshades-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 21.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 67.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 111.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "sand-raiders-of-sophie-priv8-software",
    "title": "SAND: Raiders of Sophie (Priv8 Software)",
    "category": "SAND: Raiders of Sophie",
    "tagline": "SAND: Raiders of Sophie (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/stream-studio-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "30 Dias",
        "priceBRL": 152.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "squad-priv8-software",
    "title": "Squad (Priv8 Software)",
    "category": "Squad",
    "tagline": "Squad (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/performance-audit-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 10.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 25.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 71.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "spoofer-hwid",
    "title": "Spoofer \\[HWID\\]",
    "category": "Geral",
    "tagline": "Spoofer \\[HWID\\] Acesso",
    "description": "Permanent & Temporary Support Supported Anti-Cheats ✅ Easy Anti-Cheat\n(EAC)\n✅ BattlEye (BE)\nOption 1 --- Permanent Spoof If you choose the Permanent Spoof (Option\n1), you will need to:\nFormat your computer.\nFlash your motherboard BIOS.\nAfter completing the procedure, you will no longer need to run t...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/game-setup-pro-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "spoofer-warzone-ranked-hwid",
    "title": "Spoofer Warzone + Ranked \\[HWID\\]",
    "category": "Geral",
    "tagline": "Spoofer Warzone + Ranked \\[HWID\\] Acesso",
    "description": "Support All PC's. Support All COD's.\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "unturned-priv8-software",
    "title": "Unturned (Priv8 Software)",
    "category": "Unturned",
    "tagline": "Unturned (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/creator-identity-pack-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "7 Dias",
        "priceBRL": 26.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 91.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "valorant-priv8-software",
    "title": "Valorant (Priv8 Software)",
    "category": "Valorant",
    "tagline": "Valorant (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/steam-profile-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 46.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 178.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 330.99
      }
    ],
    "youtubeId": "vVZvtLHwQwk"
  },
  {
    "slug": "warface-spoofer-priv8-software",
    "title": "Warface + Spoofer (Priv8 Software)",
    "category": "Warface",
    "tagline": "Warface + Spoofer (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Windows: All Windows 10/11\nCPU: All Processors\nGPU: All Graphics...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/reshades-6dnx.webp",
    "status": "available",
    "variants": [
      {
        "name": "1 Dia",
        "priceBRL": 17.99
      },
      {
        "name": "7 Dias",
        "priceBRL": 70.99
      },
      {
        "name": "30 Dias",
        "priceBRL": 101.99
      }
    ],
    "youtubeId": "9cmUqBtuDMk"
  },
  {
    "slug": "warzone-full-control-aim-priv8-software",
    "title": "Warzone \\[FULL + CONTROL AIM\\] (Priv8 Software)",
    "category": "Geral",
    "tagline": "Warzone \\[FULL + CONTROL AIM\\] (Priv8 Software) Acesso",
    "description": "Aimbot funcional no controle / Aimbot working on control\nPRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Platafo...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/stream-studio-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "warzone-full-priv8-software",
    "title": "Warzone \\[FULL\\] (Priv8 Software)",
    "category": "Geral",
    "tagline": "Warzone \\[FULL\\] (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Sim\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11\nModo de J...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/performance-audit-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "warzone-esp-priv8-software",
    "title": "Warzone \\[ESP\\] (Priv8 Software)",
    "category": "Geral",
    "tagline": "Warzone \\[ESP\\] (Priv8 Software) Acesso",
    "description": "PRIV 8 \\| PRIVATE • ELITE • UNDETECT Private Plus Edition Private\nDrivers: Sim\nStream Protected: Sim\nOptimized Overlay: Sim\nPremium Features Included:\nAimbot: Não suportado\nESP Visuals: Sim\nLibrary: External\nScreen Protection: Sim\nSystem Support Plataforma: Steam\nSistema Operacional: Windows 10 & 11...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/game-setup-pro-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "zoom-ia",
    "title": "Zoom \\[IA\\]",
    "category": "Geral",
    "tagline": "Zoom \\[IA\\] Acesso",
    "description": "Super ZOOM hack.\nCompartilhando \" Zoom \\[IA\\] - Priv8 Software Cheats \\| R\\$ 15,99 \\|\nKill Your Enemies \" Pular para o resultado mais recente do Gemini\nFormato de Exibição dos Links Para garantir que os links não sejam\n\"devorados\" ao copiar, você pode utilizar o formato de link visível ou\nbloco de t...\n\n**Links Gerais de Suporte / Utilidade (Priv8 Software)**\nAo copiar qualquer tutorial padrão do produto, os links de apoio são:\n\nInstalar Drivers: [https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc](https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc)\nDownload: [https://priv8software.com.br/downloads](https://priv8software.com.br/downloads)\nPágina de Tutorial: [https://priv8software.com/tutorial](https://priv8software.com/tutorial)\nRedes Sociais: [https://priv8software.com/socials](https://priv8software.com/socials)\nComunidade do WhatsApp: [https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L](https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L)",
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  }
];

export function productStatusLabel(status: ProductStatus) {
  return status === "available" ? "Disponível" : "Sob medida";
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Menor preço de referência definido entre as variações. */
export function priceFrom(product: Product): number | null {
  const prices = product.variants
    .map((variant) => variant.priceBRL)
    .filter((price): price is number => typeof price === "number");
  return prices.length ? Math.min(...prices) : null;
}

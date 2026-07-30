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

export type ProductFeature = {
  label: string;
  value: string;
};

export type Product = {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  features?: ProductFeature[];
  systemSupport?: ProductFeature[];
  menuKeys?: ProductFeature[];
  tutorialSteps?: string[];
  image: string;
  status: ProductStatus;
  variants: Variant[];
  /** ID do vídeo do YouTube (o trecho depois de `v=`), quando disponível. */
  youtubeId?: string;
  videoOrientation?: "landscape" | "portrait";
};

export const products: Product[] = [
  {
    "slug": "dayz-6DNX-software",
    "title": "DayZ",
    "category": "DayZ",
    "tagline": "DayZ Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "description": "Duplication loot in DAYZ.",
    "features": [],
    "systemSupport": [],
    "menuKeys": [],
    "tutorialSteps": [],
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
    "slug": "dead-by-daylight-6DNX-software",
    "title": "Dead by Daylight",
    "category": "Dead by Daylight",
    "tagline": "Dead by Daylight Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "deadlock-6DNX-software",
    "title": "Deadlock",
    "category": "Deadlock",
    "tagline": "Deadlock Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "delta-force-6DNX-software",
    "title": "Delta Force",
    "category": "Delta Force",
    "tagline": "Delta Force Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "escape-from-tarkov-6DNX-software",
    "title": "Escape From Tarkov",
    "category": "Escape From Tarkov",
    "tagline": "Escape From Tarkov Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "farlight-84-6DNX-software",
    "title": "Farlight 84",
    "category": "Farlight 84",
    "tagline": "Farlight 84 Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "fivem-6DNX-software",
    "title": "FiveM",
    "category": "FiveM",
    "tagline": "FiveM Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "fortnite-6DNX-software",
    "title": "Fortnite",
    "category": "Fortnite",
    "tagline": "Fortnite Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Não suportado"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "description": "Freezing players to kill.",
    "features": [],
    "systemSupport": [],
    "menuKeys": [],
    "tutorialSteps": [],
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "hell-let-loose-6DNX-software",
    "title": "Hell Let Loose",
    "category": "Hell Let Loose",
    "tagline": "Hell Let Loose Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "marvel-rivals-6DNX-software",
    "title": "Marvel Rivals",
    "category": "Marvel Rivals",
    "tagline": "Marvel Rivals Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "meccha-chameleon-6DNX-software",
    "title": "Meccha Chameleon",
    "category": "Meccha Chameleon",
    "tagline": "Meccha Chameleon Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "overwatch-2-6DNX-software",
    "title": "Overwatch 2",
    "category": "Overwatch 2",
    "tagline": "Overwatch 2 Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "point-blank-6DNX-software",
    "title": "Point Blank",
    "category": "Point Blank",
    "tagline": "Point Blank Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "pubg-6DNX-software",
    "title": "PUBG",
    "category": "PUBG",
    "tagline": "PUBG Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Apenas Windows 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "description": "Full control recoil.",
    "features": [],
    "systemSupport": [],
    "menuKeys": [],
    "tutorialSteps": [],
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "redm-6DNX-software",
    "title": "RedM",
    "category": "RedM",
    "tagline": "RedM Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "roblox-6DNX-software",
    "title": "Roblox",
    "category": "Roblox",
    "tagline": "Roblox Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "rust-6DNX-software",
    "title": "Rust",
    "category": "Rust",
    "tagline": "Rust Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Não suportado"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "sand-raiders-of-sophie-6DNX-software",
    "title": "SAND: Raiders of Sophie",
    "category": "SAND: Raiders of Sophie",
    "tagline": "SAND: Raiders of Sophie Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "squad-6DNX-software",
    "title": "Squad",
    "category": "Squad",
    "tagline": "Squad Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "description": "Permanent & Temporary Support Supported Anti-Cheats ✅ Easy Anti-Cheat\n(EAC)\n✅ BattlEye (BE)\nOption 1 --- Permanent Spoof If you choose the Permanent Spoof (Option\n1), you will need to:\nFormat your computer.\nFlash your motherboard BIOS.\nAfter completing the procedure, you will no longer need to run the\nspoofer every time you turn on your PC.\nTutorial Permanente\nOption 2 --- Temporary Spoof If you choose the Temporary Spoof (Option\n2), you will need to run the spoofer every time you restart your\ncomputer.\nTemporary Tutorial:\nOpen the spoofer.\nSelect Option 2.\nPress Y on every confirmation request.\nWait until all operations turn green.\nClose the program.\nDone. Your temporary spoof will be active until the next system restart.",
    "features": [],
    "systemSupport": [],
    "menuKeys": [],
    "tutorialSteps": [],
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
    "description": "Support All PC's. Support All COD's.",
    "features": [],
    "systemSupport": [],
    "menuKeys": [],
    "tutorialSteps": [],
    "image": "/products/card-art/aim-training-lab-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "unturned-6DNX-software",
    "title": "Unturned",
    "category": "Unturned",
    "tagline": "Unturned Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "valorant-6DNX-software",
    "title": "Valorant",
    "category": "Valorant",
    "tagline": "Valorant Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "slug": "warface-spoofer-6DNX-software",
    "title": "Warface + Spoofer",
    "category": "Warface",
    "tagline": "Warface + Spoofer Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      },
      {
        "label": "System Support Windows",
        "value": "All Windows 10/11"
      },
      {
        "label": "CPU",
        "value": "All Processors"
      },
      {
        "label": "GPU",
        "value": "All Graphics Cards"
      },
      {
        "label": "Controller",
        "value": "Not Supported"
      },
      {
        "label": "Smartphone",
        "value": "Not Supported"
      }
    ],
    "systemSupport": [],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Close application + clean traces"
      },
      {
        "label": "🟣 INSERT",
        "value": "Hide / Show menu"
      }
    ],
    "tutorialSteps": [
      "Password to extract: 123",
      "Open first Loader and login using your details.",
      "After loader displays \"Waiting game\", open the game.",
      "Menu opens automatically in-game.",
      "Disable Core Isolation (HVCI) if crashes happen.",
      "Use END to clean traces from device.",
      "Keep the program on Disk C or Desktop. DO NOT USE USB OR ANOTHER DRIVE.",
      "Session login lasts 5 hours maximum.",
      "If bluescreen happens, delete everything, restart and download again.",
      "Avoid passwords with special characters: !@#\\$%",
      "WARCHAOS - A PIADA DO ANTI-CHEAT SE REPETE 01/07/2026 CARDOZO DA 6DNX ·",
      "906 visualizações",
      "WARCHAOS - A PIADA DO ANTI-CHEAT SE REPETE 01/07/2026 Abre em uma nova",
      "janela"
    ],
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
    "slug": "warzone-full-control-aim-6DNX-software",
    "title": "Warzone \\[FULL + CONTROL AIM\\]",
    "category": "Geral",
    "tagline": "Warzone \\[FULL + CONTROL AIM\\] Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo.",
      "YouTube FIZ UM CHEAT IGUAL O DOS \"STRUMERS\" PARA VOCÊS DO CONTROLE",
      "FIZ UM CHEAT IGUAL O DOS \"STRUMERS\" PARA VOCÊS DO CONTROLE Agora o",
      "minimapa é seu melhor amigo também, bejos Seninha !! Vocês pediram então",
      "deixem o like !!!"
    ],
    "image": "/products/card-art/stream-studio-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "warzone-full-6DNX-software",
    "title": "Warzone \\[FULL\\]",
    "category": "Geral",
    "tagline": "Warzone \\[FULL\\] Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Sim"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo.",
      "YouTube FIZ UM CHEAT IGUAL O DOS \"STRUMERS\" PARA VOCÊS DO CONTROLE",
      "FIZ UM CHEAT IGUAL O DOS \"STRUMERS\" PARA VOCÊS DO CONTROLE Agora o",
      "minimapa é seu melhor amigo também, bejos Seninha !! Vocês pediram então",
      "deixem o like !!!"
    ],
    "image": "/products/card-art/performance-audit-6dnx.webp",
    "status": "available",
    "variants": [],
    "youtubeId": "BqPwa1SXowE"
  },
  {
    "slug": "warzone-esp-6DNX-software",
    "title": "Warzone \\[ESP\\]",
    "category": "Geral",
    "tagline": "Warzone \\[ESP\\] Acesso",
    "description": "",
    "features": [
      {
        "label": "Drivers",
        "value": "Sim"
      },
      {
        "label": "Stream Protected",
        "value": "Sim"
      },
      {
        "label": "Optimized Overlay",
        "value": "Sim"
      },
      {
        "label": "Premium Features Included",
        "value": ""
      },
      {
        "label": "Aimbot",
        "value": "Não suportado"
      },
      {
        "label": "ESP Visuals",
        "value": "Sim"
      },
      {
        "label": "Library",
        "value": "External"
      },
      {
        "label": "Screen Protection",
        "value": "Sim"
      }
    ],
    "systemSupport": [
      {
        "label": "Plataforma",
        "value": "Steam"
      },
      {
        "label": "Sistema Operacional",
        "value": "Windows 10 & 11"
      },
      {
        "label": "Modo de Janela",
        "value": "Borderless"
      },
      {
        "label": "Overlay Exigido",
        "value": "Discord Required"
      },
      {
        "label": "GPU",
        "value": "Nvidia & AMD"
      },
      {
        "label": "Mobile",
        "value": "Não suportado"
      }
    ],
    "menuKeys": [
      {
        "label": "🔴 END",
        "value": "Fecha a aplicação + limpa rastros"
      },
      {
        "label": "🟣 INSERT",
        "value": "Oculta / Exibe o menu"
      }
    ],
    "tutorialSteps": [
      "Feche o Discord completamente.",
      "Execute o Discord como Administrador.",
      "Entre em qualquer sala de voz do Discord.",
      "Sua foto de perfil deve aparecer no canto superior esquerdo. Isso",
      "confirma que o overlay está funcionando.",
      "Esta versão usa o novo sistema de Overlay do Discord.",
      "A aceleração de hardware do Discord é recomendada. Alguns monitores",
      "podem exigir a desativação do HDR ou HDR+.",
      "Baixe os arquivos.",
      "Extraia os arquivos usando a senha: 123.",
      "Abra o jogo.",
      "Permaneça no Lobby ou Modo de Treinamento.",
      "Abra o programa.",
      "Faça login usando os detalhes da sua conta.",
      "O menu abrirá automaticamente dentro do jogo."
    ],
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
    "description": "Super ZOOM hack.\nCompartilhando \" Zoom \\[IA\\] - 6DNX Cheats \\| R\\$ 15,99 \\|\nKill Your Enemies \" Pular para o resultado mais recente do Gemini\nFormato de Exibição dos Links Para garantir que os links não sejam\n\"devorados\" ao copiar, você pode utilizar o formato de link visível ou\nbloco de texto/código:\nLink em Texto Explícito: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\nFormatado com Rótulo e URL: ▶ Vídeo Tutorial\n(<https://www.youtube.com/watch?v=vVZvtLHwQwk>)\nLista Consolidada de Produtos com Links Visíveis 1. DayZ Título: DayZ\n(6DNX)\nPreços: 1 Dia: R\\$ 30,99 \\| 7 Dias: R\\$ 66,99 \\| 30 Dias: R\\$ 173,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n2.  DayZ Dupper Título: DayZ Dupper\nPreços: 1 Dia: R\\$ 15,99 \\| 7 Dias: R\\$ 25,99 \\| 30 Dias: R\\$ 50,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=_2cS7WUqKM4>\n3.  Dead by Daylight Título: Dead by Daylight\nPreços: 1 Dia: R\\$ 20,99 \\| 7 Dias: R\\$ 61,99 \\| 30 Dias: R\\$ 137,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=iSq-wFY_rr8>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n4.  Deadlock Título: Deadlock\nPreços: 30 Dias: R\\$ 91,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n5.  Delta Force Título: Delta Force\nPreços: 7 Dias: R\\$ 152,99 \\| 30 Dias: R\\$ 203,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n6.  Escape From Tarkov Título: Escape From Tarkov\nPreços: 7 Dias: R\\$ 101,99 \\| 30 Dias: R\\$ 203,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n7.  Farlight 84 Título: Farlight 84\nPreços: 1 Dia: R\\$ 10,99 \\| 7 Dias: R\\$ 30,99 \\| 30 Dias: R\\$ 81,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=Q4Ti1Bf07Lg>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n8.  FiveM Título: FiveM\nPreços: 1 Dia: R\\$ 10,99 \\| 7 Dias: R\\$ 30,99 \\| 30 Dias: R\\$ 86,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=k1cWobVvgKo>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n9.  Fortnite Título: Fortnite\nPreços: 1 Dia: R\\$ 35,99 \\| 7 Dias: R\\$ 107,99 \\| 30 Dias: R\\$ 202,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n10. Hell Let Loose Título: Hell Let Loose\nPreços: 1 Dia: R\\$ 10,99 \\| 7 Dias: R\\$ 30,99 \\| 30 Dias: R\\$ 81,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n11. Marvel Rivals Título: Marvel Rivals\nPreços: 1 Dia: R\\$ 10,99 \\| 7 Dias: R\\$ 25,99 \\| 30 Dias: R\\$ 71,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n12. Meccha Chameleon Título: Meccha Chameleon\nPreços: 30 Dias: R\\$ 61,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n13. Overwatch 2 Título: Overwatch 2\nPreços: 1 Dia: R\\$ 10,99 \\| 7 Dias: R\\$ 31,99 \\| 30 Dias: R\\$ 87,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=-oL9_VtGJgE>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n14. Point Blank Título: Point Blank\nPreços: 7 Dias: R\\$ 30,99 \\| 30 Dias: R\\$ 81,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n15. PUBG Título: PUBG\nPreços: 1 Dia: R\\$ 46,99 \\| 7 Dias: R\\$ 134,99 \\| 30 Dias: R\\$ 252,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=sf6Kux6QdSI>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n16. Recoil \\[IA\\] Título: Recoil \\[IA\\]\nPreços: 1 Dia: R\\$ 15,99 \\| 7 Dias: R\\$ 25,99 \\| 30 Dias: R\\$ 50,99\nLinks de Vídeo: Sem vídeo disponível.\n17. RedM Título: RedM\nPreços: 30 Dias: R\\$ 132,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n18. Roblox Título: Roblox\nPreços: 1 Dia: R\\$ 11,99 \\| 7 Dias: R\\$ 31,99 \\| 30 Dias: R\\$ 88,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n19. Rust Título: Rust\nPreços: 1 Dia: R\\$ 21,99 \\| 7 Dias: R\\$ 67,99 \\| 30 Dias: R\\$ 111,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=s8D7QlxiHmE>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n20. SAND: Raiders of Sophie Título: SAND: Raiders of Sophie (6DNX\nSoftware)\nPreços: 30 Dias: R\\$ 152,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n21. Squad Título: Squad\nPreços: 1 Dia: R\\$ 10,99 \\| 7 Dias: R\\$ 25,99 \\| 30 Dias: R\\$ 71,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=-Ltrv13yRE8>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n22. Spoofer \\[HWID\\] Título: Spoofer \\[HWID\\]\nPreços: 1 Dia: R\\$ 21,99 \\| 7 Dias: R\\$ 47,99 \\| 30 Dias: R\\$ 122,99\nLinks Relacionados:\nTutorial Permanente:\n<https://teste13367928312343.my.canva.site/robot-spoofer>\n23. Spoofer Warzone + Ranked \\[HWID\\] Título: Spoofer Warzone + Ranked\n\\[HWID\\]\nPreços: 1 Dia: R\\$ 37,99 \\| 7 Dias: R\\$ 69,99 \\| 30 Dias: R\\$ 216,99\nLinks de Vídeo: Sem vídeo disponível.\n24. Unturned Título: Unturned\nPreços: 7 Dias: R\\$ 26,99 \\| 30 Dias: R\\$ 91,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n25. Valorant Título: Valorant\nPreços: 1 Dia: R\\$ 46,99 \\| 7 Dias: R\\$ 178,99 \\| 30 Dias: R\\$ 330,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=z2ornKhoK1g>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n26. Warface + Spoofer Título: Warface + Spoofer\nPreços: 1 Dia: R\\$ 17,99 \\| 7 Dias: R\\$ 70,99 \\| 30 Dias: R\\$ 101,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=9cmUqBtuDMk>\n27. Warzone \\[FULL + CONTROL AIM\\] Título: Warzone \\[FULL + CONTROL\nAIM\\]\nPreços: 30 Dias: R\\$ 357,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=AX4rM8YSpJs>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n28. Warzone \\[FULL\\] Título: Warzone \\[FULL\\]\nPreços: 1 Dia: R\\$ 53,99 \\| 7 Dias: R\\$ 164,99 \\| 30 Dias: R\\$ 317,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=AX4rM8YSpJs>\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n29. Warzone \\[ESP\\] Título: Warzone \\[ESP\\]\nPreços: 7 Dias: R\\$ 102,99 \\| 30 Dias: R\\$ 204,99\nLinks de Vídeo:\nVídeo Tutorial: <https://www.youtube.com/watch?v=vVZvtLHwQwk>\n30. Zoom \\[IA\\] Título: Zoom \\[IA\\]\nPreços: 1 Dia: R\\$ 15,99 \\| 7 Dias: R\\$ 25,99 \\| 30 Dias: R\\$ 50,99\nLinks de Vídeo:\nVídeo Demonstrativo: <https://www.youtube.com/watch?v=s8D7QlxiHmE>\nLinks Gerais de Suporte / Utilidade Ao copiar qualquer\ntutorial padrão do produto, os links de apoio são:\nInstalar Drivers:\n<https://drive.google.com/drive/u/1/folders/11d8qCm1Vh-erPZqXxgc3aGRp3o_d08Rc>\nDownload: <https://6DNXsoftware.com.br/downloads>\nPágina de Tutorial: <https://6DNXsoftware.com/tutorial>\nRedes Sociais: <https://6DNXsoftware.com/socials>\nComunidade do WhatsApp:\n<https://chat.whatsapp.com/E8M62tClaZT42vTUZNuu0L>",
    "features": [],
    "systemSupport": [],
    "menuKeys": [],
    "tutorialSteps": [],
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

# Pendências e Próximos Passos - NutriMay Site 2.0

## Tarefas Pendentes
- [ ] **Desativar Modo de Desenvolvimento (CDN)**: Quando o site for lançado oficialmente para os clientes ou estivermos recebendo alto tráfego, devemos lembrar de voltar no painel da Hostinger ("Desempenho" > "Status do CDN") e **desativar** o Modo de Desenvolvimento. Isso vai religar o cache global, deixando o site incrivelmente rápido e protegendo o servidor.
- [ ] **Sistema de Permissões de Administrador (Role-based Access Control)**: Substituir a verificação estática de e-mails (`header.tsx`) por uma verificação dinâmica de "Role" (nível de acesso) puxando o cargo diretamente da collection de usuários no Firebase. Isso permitirá escalar e adicionar novos perfis de funcionários e gerentes de forma segura.
- [ ] **E-mails do Firebase com identidade MayNutri**: Personalizar os templates de e-mail do Firebase (senha esquecida, verificação de conta) com a marca MayNutri. Acessar: Firebase Console → Authentication → Templates → editar nome do remetente para "MayNutri" e endereço de resposta para `contato@maynutri.com.br`.
- [ ] **Domínio de remetente personalizado nos e-mails**: Configurar `noreply@maynutri.com.br` como remetente oficial dos e-mails do Firebase (em vez do domínio genérico do Google). Requer verificação de DNS na Hostinger. Referência: https://support.google.com/firebase/answer/7000714
- [ ] **Login com Apple**: Ativar o login com Apple após adquirir conta Apple Developer (US$ 99/ano). Configurar Service ID e Team ID no Firebase Console → Authentication → Sign-in method → Apple.
- [ ] **E-mails automáticos de boas-vindas e aprovação**: Enviar e-mail automático quando um usuário se cadastrar (boas-vindas) e quando for aprovado pelo admin. Opções: Firebase Extensions (Trigger Email), SendGrid ou Resend.
- [ ] **Notificação WhatsApp para o Admin**: Receber mensagem automática no WhatsApp quando um novo usuário entrar na lista de espera (para agilizar aprovação). Integrar via Twilio ou Z-API.
- [ ] **Regras de Segurança do Firestore**: Travar as Security Rules do Firestore para produção. Atualmente as regras estão abertas. Implementar regras que permitam ao usuário ler/escrever apenas seus próprios dados.

## Tarefas Concluídas
- [x] Conexão com repositório no GitHub.
- [x] Configuração e hospedagem contínua na Hostinger com variáveis de ambiente.
- [x] Link provisório de acesso Admin concedido para o e-mail principal do proprietário (`evaristosilvalima@gmail.com`).

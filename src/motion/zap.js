// WhatsApp: todo link com data-zap abre uma conversa com a clínica já com a mensagem escrita no atributo.
// O número fica em src/config.js. Sem JS, o link leva à seção de agendamento.
import { CLINICA } from '../config.js';

export function zap() {
  document.querySelectorAll('a[data-zap]').forEach((a) => {
    a.href = `https://wa.me/${CLINICA.whatsapp}?text=${encodeURIComponent(a.dataset.zap)}`;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

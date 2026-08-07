/* DIGIY MON COMMERCE — chargeur V3 anti-boucle PIN
 * Build: pos-pin-session-v3-20260807
 * La session PIN valide reste l'autorité pendant 8 h.
 * On neutralise uniquement le second contrôle ABOS/RPC qui pouvait effacer une session valide.
 */
(async function(){
  'use strict';

  const SOURCE='./assets/js/pos-secure-loader.js?v=raw-20260807-1550';
  const BAD_BLOCK=`    if(!(await accessAllowed(session.phone))){
      clearAccess();
      fail('Accès MON COMMERCE inactif. Entre un PIN lié à un abonnement POS actif.');
      setTimeout(()=>location.replace('./pin.html'),900);
      return;
    }

`;

  try{
    const response=await fetch(SOURCE,{cache:'no-store'});
    if(!response.ok)throw new Error('chargeur source '+response.status);
    let code=await response.text();

    if(!code.includes(BAD_BLOCK)){
      throw new Error('bloc anti-boucle non trouvé');
    }

    code=code.replace(BAD_BLOCK,"    // Session PIN déjà validée : aucun second contrôle réseau ne peut la détruire.\n\n");
    code=code.replace('pos-cloud-profile-rpc-abos-v2-20260722','pos-pin-session-v3-20260807');
    code=code.replace("Vérifie la session PIN, l'accès ABOS et branche la fiche publique sur la RPC sécurisée.","Vérifie la session PIN et branche la fiche publique sans second contrôle ABOS après authentification.");

    const script=document.createElement('script');
    script.textContent=code+'\n//# sourceURL=pos-secure-loader-v3-runtime.js';
    document.head.appendChild(script);
  }catch(error){
    console.error('[DIGIY POS V3]',error);
    const msg=document.getElementById('msg');
    const spin=document.getElementById('spin');
    const login=document.getElementById('login');
    if(msg)msg.textContent='Ouverture impossible. Recharge la page ou entre le PIN.';
    if(spin)spin.hidden=true;
    if(login)login.hidden=false;
  }
})();

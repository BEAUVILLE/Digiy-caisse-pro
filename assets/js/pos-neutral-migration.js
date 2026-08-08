/* DIGIY MON COMMERCE — migration prudente du moule vierge
 * Supprime uniquement les anciennes données de démonstration et cibles QR héritées.
 * Ne touche jamais aux clés PIN ou à la session d'accès.
 */
(function(){
  'use strict';
  const MARK='DIGIY_POS_NEUTRALIZED_V1';
  const QR_MARK='DIGIY_POS_QR_CANONICAL_V3';
  const parse=raw=>{try{return JSON.parse(raw||'null')}catch(_){return null}};
  const legacyTarget=raw=>/mon-commerce\.digiylyfe\.com\/fiche-astou\.html/i.test(String(raw||''));
  const norm=raw=>String(raw||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const canonicalTarget=(session,biz)=>{
    const phone=String((session&&session.phone)||biz.phone||biz.whatsapp||'').replace(/\D/g,'');
    const identity=norm(((session&&session.slug)||localStorage.getItem('digiy_pos_slug')||'')+' '+(biz.name||localStorage.getItem('digiy_pos_shop_name')||''));
    if(phone.endsWith('786523129')||phone.endsWith('771742749')||/(^|-)bcheikh($|-)/.test(identity))return 'https://bcheikh.digiylyfe.com/';
    if(phone.endsWith('778765785')||identity.includes('astou-boutique')||identity==='astou')return 'https://astou-boutique.digiylyfe.com/?lang=fr';
    return '';
  };

  try{
    const session=parse(sessionStorage.getItem('DIGIY_POS_PRO_SESSION_V1')||localStorage.getItem('DIGIY_POS_PRO_SESSION_V1'))||{};
    const existingBiz=parse(localStorage.getItem('digiy_pos_stable_biz_v1'))||{};
    const canonical=canonicalTarget(session,existingBiz);

    /* Ce nettoyage QR s'exécute même si la première migration avait déjà été marquée. */
    const qrKeys=[
      'DIGIY_COMMERCE_QR_PUBLIC_TARGET',
      'DIGIY_EXPLORE_PUBLIC_URL',
      'digiy_explore_public_url',
      'digiy_pos_qr_target_url',
      'digiy_pos_public_url',
      'digiy_pos_qr_image_url'
    ];
    if(canonical){
      ['DIGIY_COMMERCE_QR_PUBLIC_TARGET','digiy_pos_qr_target_url','digiy_pos_public_url'].forEach(key=>{
        localStorage.setItem(key,canonical);
        sessionStorage.setItem(key,canonical);
      });
      existingBiz.publicLink=canonical;
      localStorage.setItem('digiy_pos_stable_biz_v1',JSON.stringify(existingBiz));
    }else{
      qrKeys.forEach(key=>{
        const value=localStorage.getItem(key)||sessionStorage.getItem(key)||'';
        if(legacyTarget(value)){
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
      });
      if(legacyTarget(existingBiz.publicLink)){
        existingBiz.publicLink='';
        localStorage.setItem('digiy_pos_stable_biz_v1',JSON.stringify(existingBiz));
      }
    }
    localStorage.setItem(QR_MARK,JSON.stringify({canonical:canonical||'',at:new Date().toISOString()}));

    if(localStorage.getItem(MARK))return;

    const biz=parse(localStorage.getItem('digiy_pos_stable_biz_v1'))||{};
    const products=parse(localStorage.getItem('digiy_pos_stable_products_v1'));
    const name=String(biz.name||localStorage.getItem('digiy_pos_shop_name')||'').trim();
    const activity=String(biz.activity||localStorage.getItem('digiy_pos_activity')||'').trim();
    const publicLink=String(biz.publicLink||localStorage.getItem('digiy_pos_public_url')||localStorage.getItem('digiy_pos_qr_target_url')||'').trim();
    const demoName=/^(linea|astou boutique|boutique linge & style)$/i.test(name);
    const demoActivity=/^linge de maison$/i.test(activity);
    const demoLink=legacyTarget(publicLink);
    const demoIds=new Set(['p_drap_2p','p_drap_1p','p_parure','p_taie','p_serviette_bain','p_peignoir','p_couette','p_oreiller','p_nappe','p_torchon','p_article_1','p_service_1']);
    const demoProducts=Array.isArray(products)&&products.length>0&&products.every(item=>item&&demoIds.has(String(item.id||'')));
    const personalized=!!String(biz.owner||biz.phone||biz.address||biz.city||'').trim();

    if(!canonical&&!personalized&&(demoName||demoLink||(demoActivity&&demoProducts))){
      ['digiy_pos_stable_products_v1','digiy_pos_stable_sales_v1','digiy_pos_stable_moves_v1','digiy_pos_stable_biz_v1','digiy_pos_stable_cart_v1','digiy_pos_public_url','digiy_pos_qr_target_url','digiy_pos_qr_image_url','digiy_pos_shop_name','digiy_pos_activity','caisse_shop'].forEach(key=>localStorage.removeItem(key));
      localStorage.setItem(MARK,JSON.stringify({cleaned:true,at:new Date().toISOString()}));
    }else{
      localStorage.setItem(MARK,JSON.stringify({cleaned:false,at:new Date().toISOString()}));
    }
  }catch(error){
    console.error('[DIGIY POS MIGRATION]',error);
  }
})();

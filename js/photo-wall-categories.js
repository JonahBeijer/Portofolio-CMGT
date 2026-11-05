// Groepen op basis van het zichtbare onderwerp; nieuwe foto's komen bij Tussendoor.
export const photoCategories = [
 {id:'travel',nl:'Traveling',en:'Traveling',files:['8d5b5d58-541e-4392-8c7a-599fe96da98e','IMG_0152','IMG_1659','IMG_1924','IMG_2177','IMG_2257','IMG_2929','IMG_4026','IMG_4182','IMG_4492','IMG_5306','IMG_5472','IMG_5867','IMG_5886','IMG_6163','IMG_6193']},
 {id:'live',nl:'Events',en:'Events',files:['IMG_0601','IMG_0602','IMG_2837','IMG_2854','IMG_5840','IMG_7071','IMG_7313','IMG_7314','IMG_7315','IMG_7317','IMG_7715']},
 {id:'people',nl:'Loved ones',en:'Loved ones',files:['1e4516a9-a683-439f-ac1e-c510d4e7db1f','6ce553da-e1b7-4b3f-87e8-70897fbbb0a2','810c928c-0ada-416e-bb74-7a06af1d2738','7241147b-5a23-40d0-97d4-8cfe35210d61','20200503_004941','a7d2e8fd-4706-4a99-9951-2c7b80e113fd','Image_77721173','IMG_1294','IMG_2501','IMG_3270','IMG_3428','IMG_3873','IMG_5949','IMG_9076']},
 {id:'moments',nl:'Dump',en:'Dump',files:['IMG_2900','IMG_7671','IMG_8892','IMG_9185']},
 {id:'me',nl:'Me',en:'Me',files:['IMG_1602']}
];
export function categoryFor(image){const name=image.split('/').pop().replace(/\.[^.]+$/,'');return photoCategories.find(group=>group.files.includes(name))?.id||'moments';}

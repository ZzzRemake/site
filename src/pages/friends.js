import React from 'react';
import Layout from '@theme/Layout';
import GiscusComponent from '@site/src/components/GiscusComment'

import style from './friends.module.css';

const FriendList = [
  {
    "avatar": "https://avatars.githubusercontent.com/u/91040264",
    "name": "Akejyo",
    "description": "Integrated Strategies Master⭐⭐⭐⭐⭐",
    "link": "https://akejyo.github.io/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/102305036",
    "name": "IrisHyaline",
    "description": "Minesweeper.",
    "link": "https://www.cnblogs.com/IrisHyaline/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/29620619",
    "name": "Yaossg",
    "description": "Programming for fun.",
    "link": "https://yaossg.com",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/106670529",
    "name": "风唤长河",
    "description": "间歇性踌躇满志，持续性混吃等死（并非）",
    "link": "https://ventusvocatflumen.cn/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/25294996",
    "name": "Timlzh",
    "description": "🕶️ 现役网安黑阔",
    "link": "https://timlzh.com/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/49082837",
    "name": "Zbwer",
    "description": "Miracle Is Everywhere.",
    "link": "https://blog.zbwer.work/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/102424651",
    "name": "Je3ter",
    "description": "ACMer(very simple?!).",
    "link": "https://je3ter.github.io/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/88037744",
    "name": "Xlll",
    "description": "分明平静无风，是因为追上了他的心吧",
    "link": "https://4ever-xxxl.github.io/",
  },
  {
    "avatar": "https://blog.wspdwzh.space/img/IMG_8952.JPG",
    "name": "PeterTan",
    "description": "陷入死锁......",
    "link": "https://blog.wspdwzh.space/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/86053421",
    "name": "EricZhang",
    "description": "PhD desuwa",
    "link": "https://www.ericzhuestc.site/",
  },
  {
    "avatar": "https://kasuha.com/avatar.webp",
    "name": "霞の葉間",
    "description": "光と言葉の狭間",
    "link": "https://kasuha.com",
  },
]


const FriendCard = ({ avatar, name, description, link }) => {
  return (
    <li className={style.card}>
      <a className={style.card_link} href={link} target="_blank" rel="noopener noreferrer"></a>
      <img className={style.card_img} src={avatar ? avatar : "./img/akkarin.jpg"} alt={name} />
      <div className={style.card_content}>
        <h2 className={style.card_title}>{name}</h2>
        <p className={style.card_desc}>{description}</p>
      </div>
    </li>
  );
};

function FriendTable() {
  return (
    <div class={style.friendtable}>
      <h1>Friends</h1>
      <p>😘Get up and bro links...</p>
      <hr></hr>
      <ul className={style.cardlist}>
        {FriendList.sort((a, b) => a.name.localeCompare(b.name)).map((prop, id) => (
          <FriendCard key={id} {...prop}></FriendCard>
        ))}
      </ul>
    </div>
  )
}

export default function Friends() {
  return (
    <Layout title="ZzzRemake's Friends" description="Friends of ZzzRemake">
      <FriendTable></FriendTable>
      <GiscusComponent />
    </Layout>
  );
}
import React from 'react';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import GiscusComponent from '@site/src/components/GiscusComment'

import AvatarPngUrl from '@site/static/img/remake.png';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';  

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
  {
    "avatar": "https://avatars.githubusercontent.com/u/61999173",
    "name": "Syrinka",
    "description": "Just Daydream",
    "link": "https://blog.hareta.ren/",
  },
  {
    "avatar": "https://avatars.githubusercontent.com/u/64351788",
    "name": "Sake",
    "description": "FULL-STACK",
    "link": "https://sakee.cn/",
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
  const siteUrl = useDocusaurusContext().siteConfig.url;
  return ( 
    <div class={style.friendtable}>
      <ul class={style.cardlist}>
        {FriendList.sort((a, b) => a.name.localeCompare(b.name)).map((prop, id) => (
          <FriendCard key={id} {...prop}></FriendCard>
        ))}
      </ul>
      <div class="markdown">
        <hr></hr>
        <h1>友链申请</h1>
        <p>😘Get up and bro links...欢迎交换友链捏</p>
        <p>基本要求：</p>
        <ul>
          <li>站点可正常访问，HTTPS优先；</li>
          <li>内容健康、无恶意脚本/广告轰炸；</li>
          <li>慎重对齐友链交换，交换前在站点添加本博客抓手</li>
          <li>刷够❤好感度❤可解锁后门</li>
        </ul>

        <p>您可在下方评论区，或通过邮箱发送您的站点信息。</p>

        <hr></hr>
        <h1>Site Info</h1>
        <p>🥰站点信息（及友链交换格式），供您参考</p>
        <ul>
          <li>名称: ZzzRemake</li>
          <li>链接: <a href='https://zzzremake.github.io/site/'>https://zzzremake.github.io/site/</a></li>
          <li>描述: Do Something Different(English)/泉香而酒冽，玉碗盛来琥珀光，直饮到梅梢月上，醉扶归，却为宜会亲友 (中文)</li>
          <li>头像: <a href={siteUrl + AvatarPngUrl}>{siteUrl + AvatarPngUrl}</a></li>
        </ul>
      </div>
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
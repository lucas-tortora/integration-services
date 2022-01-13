"use strict";(self.webpackChunkiota_wiki=self.webpackChunkiota_wiki||[]).push([[488],{64854:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return o},contentTitle:function(){return c},metadata:function(){return s},toc:function(){return p},default:function(){return d}});var a=n(83117),r=n(80102),i=(n(67294),n(3905)),l=["components"],o={},c="Search Channel and Validate Data",s={unversionedId:"examples/search-channel-and-validate-data",id:"examples/search-channel-and-validate-data",title:"Search Channel and Validate Data",description:"The example-7",source:"@site/external/integration-services/documentation/docs/examples/search-channel-and-validate-data.md",sourceDirName:"examples",slug:"/examples/search-channel-and-validate-data",permalink:"/integration-services/integration-services/examples/search-channel-and-validate-data",tags:[],version:"current",frontMatter:{},sidebar:"docs",previous:{title:"Authorize Channel",permalink:"/integration-services/integration-services/examples/authorize-to-channel"},next:{title:"Overview",permalink:"/integration-services/integration-services/basics/overview"}},p=[{value:"Validate Channel&#39;s Data",id:"validate-channels-data",children:[],level:2}],u={toc:p};function d(e){var t=e.components,n=(0,r.Z)(e,l);return(0,i.kt)("wrapper",(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"search-channel-and-validate-data"},"Search Channel and Validate Data"),(0,i.kt)("p",null,"The ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/iotaledger/integration-services/blob/develop/clients/node/examples/5-SearchChannelAndValidateData.ts"},"example-7"),"\nscript is similar to previous example (",(0,i.kt)("a",{parentName:"p",href:"./authorize-to-channel"},"Authorize Channel"),") that creates a channel as ",(0,i.kt)("inlineCode",{parentName:"p"},"Owner")," and authorize a ",(0,i.kt)("inlineCode",{parentName:"p"},"User")," to write on it but:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"Owner")," send some data on the channel"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"User")," receive data and ",(0,i.kt)("em",{parentName:"li"},"modify them")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"User")," validate tampered data: the API (using Tangle and data signatures) will recognize that data are not valid (i.e. signatures not match) ")),(0,i.kt)("p",null,"You can run the example with the following:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"npm run example-7\n")),(0,i.kt)("h2",{id:"validate-channels-data"},"Validate Channel's Data"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"results")," is a set of tampered data: validation will notify it since signature\ndoesn't match:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"// Now try to validate the manipulated data\nconst validationResult2 = await userClient.validate(channelAddress, results);\n")))}d.isMDXComponent=!0},3905:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return m}});var a=n(67294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var c=a.createContext({}),s=function(e){var t=a.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},p=function(e){var t=s(e.components);return a.createElement(c.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,c=e.parentName,p=o(e,["components","mdxType","originalType","parentName"]),d=s(n),m=r,h=d["".concat(c,".").concat(m)]||d[m]||u[m]||i;return n?a.createElement(h,l(l({ref:t},p),{},{components:n})):a.createElement(h,l({ref:t},p))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,l=new Array(i);l[0]=d;var o={};for(var c in t)hasOwnProperty.call(t,c)&&(o[c]=t[c]);o.originalType=e,o.mdxType="string"==typeof e?e:r,l[1]=o;for(var s=2;s<i;s++)l[s]=n[s];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"}}]);
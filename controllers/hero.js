'use strict'
import geoip from 'geoip-lite'
import Hero from '../models/hero'

/**
 * 添加留言
 * @param {*} opts 
 */
export const putHero = async (ctx, hero) => {
	// 获取ip地址以及物理地理地址
	const ip = (ctx.req.headers['x-forwarded-for'] || 
	ctx.req.headers['x-real-ip'] || 
	ctx.req.connection.remoteAddress || 
	ctx.req.socket.remoteAddress ||
	ctx.req.connection.socket.remoteAddress ||
	ctx.req.ip ||
	ctx.req.ips[0]).replace('::ffff:', '');
	hero.ip = ip || '14.215.177.38'
	hero.agent = ctx.headers['user-agent'] || hero.agent

	const ip_location = geoip.lookup(hero.ip)

	if (ip_location) {
		hero.city = ip_location.city,
		hero.range = ip_location.range,
		hero.country = ip_location.country
	}

	// 发布评论
	return await (new Hero(hero)).save()
}

/**
 * 删除浏览墙
 * @param {评论id} _id 
 */
export const delectHero = async (_id) => {
    return await Hero.findByIdAndRemove(_id)
}

/**
 * 修改留言墙
 * @param {评论id} _id 
 * @param {修改参数} opt 
 */
export const editeHero = async (_id, opt) => {
    return await Hero.findByIdAndUpdate(_id, opt)
}

/**
 * 获取留言墙
 * @param {*} opts
 */
export const getHero = async (opts = {} ) => {
	let { current_page = 1, page_size = 12, keyword = '', state = '' } = opts
	let result = {}
    // 过滤条件
    const options = {
      sort: { _id: -1 },
      page: Number(current_page),
      limit: Number(page_size)
    }

    // 查询参数
	const querys = {}
	
	if (keyword) {
		querys.name = new RegExp(keyword)
	}

    // 审核状态查询
    if (['0', '1', '2'].includes(state)) {
      querys.state = Number(state)
    }

    // 前台请求， 重置状态
    // if (!authIsVerified(ctx.request)) {
    //   querys.state = 1
    // }

    // 查询
	result = await Hero.paginate(querys, options)
    if (result) {
		result = {
			pagination: {
				total: result.total,
				current_page: result.page,
				total_page: result.pages,
				page_size: result.limit
			},
			list: result.docs
	  	}
    } else {
		result = {}
	}
	return result
}

class APIFeatures{
	constructor(query, queryStr){
		this.query = query;
		this.queryStr = queryStr;
	}

	search(){
		const keyword = this.queryStr.keyword ? {
			$or:
			[
			{name:{
				$regex:this.queryStr.keyword,
				$options: 'i'
			}},
			{category:{
				$regex:this.queryStr.keyword,
				$options: 'i'
			}}
			]
		

		} : {};

		// console.log(keyword,this.query);
		this.query = this.query.find({...keyword});
		return this;

	}


	filter(){
		const queryCopy = {...this.queryStr};
		// console.log(queryCopy);
		
		//Removing fields from the query
		const removedFields = ['keyword', 'limit', 'page']
		removedFields.forEach(el => delete queryCopy[el]);

		//Advance filter for price, rating etc
		let queryStr = JSON.stringify(queryCopy);
		// console.log("query",queryStr);
		queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)

		// console.log(JSON.parse(queryStr));
		this.query = this.query.find(JSON.parse(queryStr));

		return this;

	}


	pagination(resPerPage){
		const currentPath = Number(this.queryStr.page) || 1;
		const skip = resPerPage * (currentPath - 1)
		// console.log("skip",skip);
		this.query = this.query.limit(resPerPage).skip(skip)
		this.query = this.query
		return this;
	}

	// infiniteScroll(){
	// 	const currentPath = Number(this.queryStr.scroll) || 8;

	// 	this.query = this.query.limit(currentPath)
	// 	this.query = this.query
	// 	return this;
	// }

}

module.exports = APIFeatures
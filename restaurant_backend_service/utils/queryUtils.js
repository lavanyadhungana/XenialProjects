/**
 * Utility functions for implementing pagination in PostgreSQL queries
 * File: src/utils/queryUtils.js
 */

/**
 * Generates a paginated query based on parameters
 * 
 * @param {Object} options - Pagination and query options
 * @param {string} options.baseQuery - The base SQL query, without ORDER BY, LIMIT, or OFFSET
 * @param {string} options.countQuery - Query to count total rows (if null, will be derived from baseQuery)
 * @param {Array} options.params - Array of parameters to use in the query
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Number of items per page
 * @param {string} options.sortField - Field to sort by
 * @param {string} options.sortOrder - Sort direction ('asc' or 'desc')
 * @param {Array} options.allowedSortFields - Array of allowed sort fields
 * @param {Object} options.fieldMappings - Mapping from API sort fields to database column names
 * @returns {Object} Object containing paginated query, count query, and their parameters
 */
const buildPaginatedQuery = (options) => {
    const {
      baseQuery,
      countQuery = null,
      params = [],
      page = 1,
      limit = 10,
      sortField = null,
      sortOrder = 'asc',
      allowedSortFields = [],
      fieldMappings = {}
    } = options;
  
    // Validate pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Page must be a positive integer');
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    
    // Validate sort parameters if provided
    if (sortField && allowedSortFields.length > 0 && !allowedSortFields.includes(sortField)) {
      throw new Error(`Sort field must be one of: ${allowedSortFields.join(', ')}`);
    }
    
    const validSortOrders = ['asc', 'desc'];
    const sortOrderLower = sortOrder.toLowerCase();
    if (!validSortOrders.includes(sortOrderLower)) {
      throw new Error(`Sort order must be one of: ${validSortOrders.join(', ')}`);
    }
    
    const offset = (pageNum - 1) * limitNum;
    
    // Generate count query if not provided
    const derivedCountQuery = countQuery || 
      `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery`;
    
    // Map the sort field to its database column equivalent if provided
    let dbSortField = sortField;
    if (sortField && fieldMappings[sortField]) {
      dbSortField = fieldMappings[sortField];
    }
    
    // Generate the final paginated query
    let paginatedQuery = baseQuery;
    
    // Add ORDER BY if sort field is provided
    if (dbSortField) {
      paginatedQuery += ` ORDER BY ${dbSortField} ${sortOrderLower}`;
    }
    
    // Add pagination
    paginatedQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, limitNum, offset];
    
    return {
      countQuery: derivedCountQuery,
      countParams: params,
      paginatedQuery,
      paginatedParams,
      pagination: {
        page: pageNum,
        limit: limitNum
      }
    };
  };
  
  /**
   * Processes pagination results and creates a standardized response object
   * 
   * @param {Object} countResult - Result from the count query
   * @param {Object} queryResult - Result from the paginated query
   * @param {Object} pagination - Pagination info (page, limit)
   * @returns {Object} Standardized response with data and pagination metadata
   */
const processPaginationResults = (countResult, queryResult, pagination) => {
    const totalCount = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalCount / pagination.limit);
    
    return {
      data: queryResult.rows,
      pagination: {
        total: totalCount,
        page: pagination.page,
        limit: pagination.limit,
        total_pages: totalPages,
        has_next_page: pagination.page < totalPages,
        has_prev_page: pagination.page > 1
      }
    };
  };
  
/**
 * Fully processes a paginated query, executing both the count and data queries
 * 
 * @param {Object} client - Database client to use for queries
 * @param {Object} options - Pagination options (see buildPaginatedQuery)
 * @returns {Promise<Object>} Promise resolving to standardized response object
 */
const executePaginatedQuery = async (client, options) => {
    try {
      const {
        countQuery,
        countParams,
        paginatedQuery,
        paginatedParams,
        pagination
      } = buildPaginatedQuery(options);
      
      // Execute count query
      const countResult = await client.query(countQuery, countParams);
      
      // Execute paginated query
      const queryResult = await client.query(paginatedQuery, paginatedParams);
      
      return processPaginationResults(countResult, queryResult, pagination);
    } catch (error) {
      throw error;
    }
};
  
/**
 * Creates simple filter conditions for WHERE clauses
 * 
 * @param {Object} filters - Key-value pairs of filters to apply
 * @param {Object} options - Options for filtering
 * @param {Object} options.exactFields - Fields that should use exact matching
 * @param {Object} options.likeFields - Fields that should use LIKE matching
 * @param {Object} options.greaterThenOrEqualFields - Fields that should used to get greater than or equals results.
 * @param {Object} options.lessThenOrEqualFields - Fields that should used to get less than or equals results.
 * @param {Object} options.fieldMappings - Mapping from API fields to database column names
 * @returns {Object} Object containing WHERE clause and parameters array
 */
const buildFilterConditions = (filters, options = {}) => {
    const {
      exactFields = [],
      likeFields = [],
      greaterThenOrEqualFields = [],
      lessThenOrEqualFields = [],
      fieldMappings = {}
    } = options;
    
    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;
    
    // Process filters
    Object.entries(filters).forEach(([field, value]) => {
      if (!value && value !== 0) return; // Skip null, undefined or empty string values
      
      // Get the actual DB column name if mapped
      const dbField = fieldMappings[field] || field;
      
      if (exactFields.includes(field)) {
        // Exact match (=)
        whereClause += ` AND ${dbField} = $${paramIndex}`;
        params.push(value);
        paramIndex++;
      } else if (likeFields.includes(field)) {
        // Partial match (ILIKE)
        whereClause += ` AND ${dbField} ILIKE $${paramIndex}`;
        params.push(`%${value}%`);
        paramIndex++;
      } else if (greaterThenOrEqualFields.includes(field) ) {
        whereClause += ` AND ${dbField} >= $${paramIndex}`
        params.push(value)
        paramIndex++;
      } else if (lessThenOrEqualFields.includes(field)) {
        whereClause += ` AND ${dbField} <= $${paramIndex}`
        params.push(value)
        paramIndex++;
      }
    });
    return {
      whereClause,
      params,
      paramIndex
    };
};

/**
 * Builds a dynamic UPDATE query with parameter placeholders
 * 
 * @param {Object} options - Options for building the update query
 * @param {string} options.tableName - The table to update
 * @param {Object} options.updateFields - Object containing field names and values to update
 * @param {Object} options.whereConditions - Object containing field names and values for WHERE clause
 * @param {Object} options.filterOptions - Options for filtering (passed to buildFilterConditions)
 * @param {boolean} options.returning - Whether to include RETURNING * (default: true)
 * @param {boolean} options.update_now - Whether to update the updated_at timestamp (default: true)
 * @returns {Object} Object containing the query string and values array
 */
const buildUpdateQuery = (options) => {
    const {
      tableName,
      updateFields = {},
      whereConditions = {},
      filterOptions = {},
      update_now = true, 
      returning = true,
    } = options;
    
    if (!tableName) {
      throw new Error('Table name is required');
    }
    
    // Start building the query
    let query = `UPDATE ${tableName} SET `;
    const values = [];
    let paramIndex = 1;
    
    // Add timestamp update by default if not explicitly provided
    let firstSetField = true;
    if (update_now) {
        query += `updated_at = NOW()`;
        firstSetField = false;
    }
    
    // Add update fields dynamically
    Object.entries(updateFields).forEach(([field, value]) => {
      // Skip undefined values and updated_at (already handled)
      if (value === undefined || field === 'updated_at') return;
      
      // If this is the first field in the SET clause, don't add a comma
      const separator = firstSetField ? '' : ', ';
      firstSetField = false;
      
      query += `${separator}${field} = $${paramIndex}`;
      values.push(value);
      paramIndex++;
    });
    
    // Use buildFilterConditions to generate WHERE clause if filterOptions is provided
    if (Object.keys(filterOptions).length > 0) {
      const { whereClause, params } = buildFilterConditions(whereConditions, filterOptions);

      if (whereClause !== '1=1') {
        // There are actual conditions beyond the initial 1=1 AND
        query += ` WHERE ${whereClause.substring(7)}`;
        values.push(...params);
        paramIndex += params.length;
      }
    }
    // Otherwise use the simple whereConditions approach
    else if (Object.keys(whereConditions).length > 0) {
      query += ' WHERE ';
      
      Object.entries(whereConditions).forEach(([field, value], index) => {
        if (index > 0) {
          query += ' AND ';
        }
        query += `${field} = $${paramIndex}`;
        values.push(value);
        paramIndex++;
      });
    }
    
    // Add RETURNING clause if requested
    if (returning) {
      query += ' RETURNING *';
    }
    
    return {
      query,
      values,
      paramCount: paramIndex - 1
    };
};

/**
 * Determines reservation type and table name based on display_id
 * 
 * @param {string} display_id - The reservation display ID (e.g. 'C-12345', 'G-67890')
 * @returns {Object} Object containing type and tableName, or null if invalid
 */
const getReservationTypeFromId = (display_id) => {
    if (!display_id) {
      return null;
    }
    
    let type = null;
    
    if (display_id.startsWith('C-')) {
      type = 'customer';
    } else if (display_id.startsWith('G-')) {
      type = 'guest';
    }
    
    if (!type) {
      return null;
    }
    
    const tableName = type === 'customer' ? 'customer_reservations' : 'guest_reservations';
    
    return {
      type,
      tableName
    };
};
  
export default {
    buildPaginatedQuery,
    processPaginationResults,
    executePaginatedQuery,
    buildFilterConditions,
    buildUpdateQuery,
    getReservationTypeFromId
};
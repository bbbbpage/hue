// Licensed to Cloudera, Inc. under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  Cloudera, Inc. licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const SET_REFS = {
  impala: async () => import(/* webpackChunkName: "impala-ref" */ './impala/setReference')
};

const UDF_REFS = {
  generic: async () => import(/* webpackChunkName: "generic-ref" */ './generic/udfReference'),
  hive: async () => import(/* webpackChunkName: "hive-ref" */ './hive/udfReference'),
  impala: async () => import(/* webpackChunkName: "impala-ref" */ './impala/udfReference'),
  pig: async () => import(/* webpackChunkName: "pig-ref" */ './pig/udfReference')
};

export const hasUdfCategories = connector => typeof UDF_REFS[connector.dialect] !== 'undefined';

export const getUdfCategories = async connector => {
  if (UDF_REFS[connector.dialect]) {
    const module = await UDF_REFS[connector.dialect]();
    if (module.UDF_CATEGORIES) {
      return module.UDF_CATEGORIES;
    }
  }
  // TODO: Fetch from API and diff/merge
  return [];
};

export const findFunction = async (connector, functionName) => {
  const categories = await getUdfCategories(connector);
  let found = undefined;
  categories.some(category => {
    if (category.functions[functionName]) {
      found = category.functions[functionName];
      return true;
    }
  });
  return found;
};

export const getArgumentTypes = async (connector, functionName, argumentPosition) => {
  const foundFunction = await findFunction(connector, functionName);
  if (!foundFunction) {
    return ['T'];
  }
  const args = foundFunction.arguments;
  if (argumentPosition > args.length) {
    const multiples = args[args.length - 1].filter(type => {
      return type.multiple;
    });
    if (multiples.length > 0) {
      return multiples
        .map(argument => {
          return argument.type;
        })
        .sort();
    }
    return [];
  }
  return args[argumentPosition - 1]
    .map(argument => {
      return argument.type;
    })
    .sort();
};
